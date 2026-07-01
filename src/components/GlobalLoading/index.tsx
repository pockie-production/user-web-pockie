
import { PockieSprite } from '../PockieSprite';
import './GlobalLoading.css';

interface GlobalLoadingProps {
  text?: string;
}

export default function GlobalLoading({ text = "Đang tải..." }: GlobalLoadingProps) {
  return (
    <div className="global-loading-container">
      <div className="global-loading-content">
        <div className="mascot-animation">
          <PockieSprite size={120} variant="cry" />
        </div>
        <div className="loading-text">{text}</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
