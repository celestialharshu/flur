import { RotateCcw } from 'lucide-react';
import { useAudioEffects } from '../hooks/useAudioEffects';
import { EQ_LABELS, EQ_PRESETS } from '../audio/audioEngine';

const REVERB_TYPES = [
  { key: 'room', label: 'Room' },
  { key: 'hall', label: 'Hall' },
  { key: 'studio', label: 'Studio' },
];

const SPATIAL_MODES = [
  { key: 'stereo', label: 'Stereo' },
  { key: 'wide', label: 'Wide' },
  { key: 'immersive', label: 'Immersive 3D' },
];

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const fmtDb = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)} dB`;
const fmtSemi = (v) => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)} st`;
const fmtPct = (v) => `${Math.round(v * 100)}%`;

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={`fx-toggle ${disabled ? 'fx-toggle--disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="fx-toggle__track"><span className="fx-toggle__thumb" /></span>
      {label && <span className="fx-toggle__label">{label}</span>}
    </label>
  );
}

function Slider({ label, value, min, max, step, onChange, format, disabled }) {
  return (
    <div className={`fx-slider ${disabled ? 'fx-slider--disabled' : ''}`}>
      <div className="fx-slider__head">
        <span>{label}</span>
        <span className="fx-slider__value">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function Segmented({ options, value, onChange, disabled }) {
  return (
    <div className="fx-segmented" role="group">
      {options.map((o) => (
        <button
          key={o.key}
          disabled={disabled}
          className={`fx-segmented__btn ${value === o.key ? 'fx-segmented__btn--active' : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, subtitle, onReset, right, children }) {
  return (
    <section className="fx-card">
      <div className="fx-card__header">
        <div>
          <h3 className="fx-card__title">{title}</h3>
          {subtitle && <p className="fx-card__subtitle">{subtitle}</p>}
        </div>
        <div className="fx-card__actions">
          {right}
          {onReset && (
            <button className="fx-reset" onClick={onReset} aria-label={`Reset ${title}`} title="Reset">
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Equalizer() {
  const { state, corsOk, canShift, active, engine } = useAudioEffects();
  const { eq, tone, pitch, reverb, spatial, speed } = state;

  // Everything except speed and varispeed pitch needs Web Audio processing.
  const blocked = corsOk === false;
  const waiting = corsOk === null;

  const presetNames = [...Object.keys(EQ_PRESETS), ...(eq.preset === 'Custom' ? ['Custom'] : [])];

  return (
    <div className="equalizer-page">
      <div className="section__header">
        <div>
          <h2 className="section__title">Equalizer & Effects</h2>
          <p className="section__subtitle">Shape the sound. Settings are saved automatically.</p>
        </div>
        <div className="fx-header-actions">
          <span className={`fx-status ${active && !blocked ? 'fx-status--on' : ''}`}>
            {blocked ? 'Limited' : active ? 'Effects on' : 'Flat'}
          </span>
          <button className="load-more__btn fx-reset-all" onClick={() => engine.reset()}>
            <RotateCcw size={14} /> Reset all
          </button>
        </div>
      </div>

      {blocked && (
        <div className="fx-notice fx-notice--warn">
          The audio server doesn't allow processing this stream, so the equalizer, bass/treble, reverb and
          spatial effects can't be applied. Playback speed and pitch (which changes tempo too) still work.
        </div>
      )}
      {waiting && (
        <div className="fx-notice">Play a song and the effects will apply to it. Your settings are already saved.</div>
      )}

      {/* ---------- Equalizer ---------- */}
      <Card
        title="Equalizer"
        subtitle="10-band graphic EQ"
        onReset={() => engine.reset('eq')}
        right={<Toggle checked={eq.enabled} onChange={(v) => engine.update('eq', { enabled: v })} label={eq.enabled ? 'On' : 'Off'} disabled={blocked} />}
      >
        <div className="fx-chips">
          {presetNames.map((name) => (
            <button
              key={name}
              disabled={blocked || name === 'Custom'}
              className={`fx-chip ${eq.preset === name ? 'fx-chip--active' : ''}`}
              onClick={() => engine.setEqPreset(name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className={`fx-eq ${!eq.enabled || blocked ? 'fx-eq--off' : ''}`}>
          {eq.gains.map((gain, i) => (
            <div key={EQ_LABELS[i]} className="fx-eq__band">
              <span className="fx-eq__gain">{gain > 0 ? '+' : ''}{Math.round(gain)}</span>
              <input
                className="fx-eq__slider"
                type="range"
                orient="vertical"
                min={-12}
                max={12}
                step={0.5}
                value={gain}
                disabled={blocked}
                onChange={(e) => engine.setEqBand(i, parseFloat(e.target.value))}
                aria-label={`${EQ_LABELS[i]} Hz`}
              />
              <span className="fx-eq__freq">{EQ_LABELS[i]}</span>
            </div>
          ))}
        </div>
        <p className="fx-hint">Frequencies in Hz · range ±12 dB · move any slider to make a custom curve</p>
      </Card>

      <div className="fx-grid">
        {/* ---------- Bass / Treble ---------- */}
        <Card title="Bass & Treble" subtitle="Quick tone control" onReset={() => engine.reset('tone')}>
          <Slider label="Bass" value={tone.bass} min={-12} max={12} step={0.5} format={fmtDb} disabled={blocked}
            onChange={(v) => engine.update('tone', { bass: v })} />
          <Slider label="Treble" value={tone.treble} min={-12} max={12} step={0.5} format={fmtDb} disabled={blocked}
            onChange={(v) => engine.update('tone', { treble: v })} />
        </Card>

        {/* ---------- Pitch ---------- */}
        <Card title="Pitch" subtitle="Shift the key up or down" onReset={() => engine.reset('pitch')}>
          <Slider label="Pitch" value={pitch.semitones} min={-12} max={12} step={0.5} format={fmtSemi}
            onChange={(v) => engine.update('pitch', { semitones: v })} />
          <Toggle
            checked={pitch.preserveTempo}
            onChange={(v) => engine.update('pitch', { preserveTempo: v })}
            label="Preserve tempo"
            disabled={!canShift}
          />
          <p className="fx-hint">
            {!canShift
              ? "Tempo can't be preserved with this audio source, so pitch changes also change the speed."
              : pitch.preserveTempo
                ? 'The song keeps its speed while the pitch changes. Large shifts sound more artificial.'
                : 'Pitch and speed change together, like a record being sped up or slowed down.'}
          </p>
        </Card>

        {/* ---------- Reverb ---------- */}
        <Card
          title="Reverb"
          subtitle="Add space to the sound"
          onReset={() => engine.reset('reverb')}
          right={<Toggle checked={reverb.enabled} onChange={(v) => engine.update('reverb', { enabled: v })} label={reverb.enabled ? 'On' : 'Off'} disabled={blocked} />}
        >
          <Segmented options={REVERB_TYPES} value={reverb.type} disabled={blocked}
            onChange={(v) => engine.update('reverb', { type: v })} />
          <Slider label="Wet / Dry" value={reverb.wet} min={0} max={1} step={0.01} format={(v) => `${fmtPct(v)} wet`}
            disabled={blocked || !reverb.enabled} onChange={(v) => engine.update('reverb', { wet: v })} />
          <Slider label="Intensity (room size)" value={reverb.intensity} min={0} max={1} step={0.01} format={fmtPct}
            disabled={blocked || !reverb.enabled} onChange={(v) => engine.update('reverb', { intensity: v })} />
        </Card>

        {/* ---------- Spatial ---------- */}
        <Card title="Spatial Audio" subtitle="Widen the stereo image" onReset={() => engine.reset('spatial')}>
          <Segmented options={SPATIAL_MODES} value={spatial.mode} disabled={blocked}
            onChange={(v) => engine.update('spatial', { mode: v })} />
          <Slider label="Intensity" value={spatial.intensity} min={0} max={1} step={0.01} format={fmtPct}
            disabled={blocked || spatial.mode === 'stereo'} onChange={(v) => engine.update('spatial', { intensity: v })} />
          <p className="fx-hint">Best with headphones. Immersive adds a subtle sense of depth around you.</p>
        </Card>
      </div>

      {/* ---------- Playback speed ---------- */}
      <Card title="Playback Speed" subtitle="0.25× – 2×" onReset={() => engine.reset('speed')}>
        <Slider label="Speed" value={speed.rate} min={0.25} max={2} step={0.05} format={(v) => `${v.toFixed(2)}×`}
          onChange={(v) => engine.update('speed', { rate: v })} />
        <div className="fx-chips">
          {SPEED_PRESETS.map((r) => (
            <button
              key={r}
              className={`fx-chip ${Math.abs(speed.rate - r) < 0.001 ? 'fx-chip--active' : ''}`}
              onClick={() => engine.update('speed', { rate: r })}
            >
              {r}×
            </button>
          ))}
        </div>
        <Toggle
          checked={speed.preservePitch}
          onChange={(v) => engine.update('speed', { preservePitch: v })}
          label="Preserve pitch"
        />
        <p className="fx-hint">
          {speed.preservePitch
            ? 'Songs get faster or slower without sounding higher or lower.'
            : 'Pitch follows the speed, so faster sounds higher and slower sounds lower.'}
        </p>
      </Card>
    </div>
  );
}

export default Equalizer;
