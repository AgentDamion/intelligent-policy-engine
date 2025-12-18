interface DotsIndicatorProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}

export const DotsIndicator = ({ total, current, onDotClick }: DotsIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-s2" role="tablist" aria-label="Panel navigation">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            index === current
              ? 'bg-ink-900 w-6'
              : 'bg-ink-300 hover:bg-ink-500'
          }`}
          aria-label={`Go to panel ${index + 1}`}
          aria-selected={index === current}
          role="tab"
        />
      ))}
    </div>
  );
};
