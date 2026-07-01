import { Component, type ErrorInfo, type ReactNode } from 'react';
import GlobalLoading from './GlobalLoading';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <GlobalLoading text="Có lỗi xảy ra, đang tải lại..." />;
    }

    return this.props.children;
  }
}
