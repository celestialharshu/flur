import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './IconButton';

function ScrollArrows({ onScrollLeft, onScrollRight }) {
  return (
    <div className="scroll-arrows">
      <IconButton
        icon={<ChevronLeft size={16} />}
        onClick={onScrollLeft}
        ariaLabel="Scroll left"
        size="sm"
      />
      <IconButton
        icon={<ChevronRight size={16} />}
        onClick={onScrollRight}
        ariaLabel="Scroll right"
        size="sm"
      />
    </div>
  );
}

export default ScrollArrows;