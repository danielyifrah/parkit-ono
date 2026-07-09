import { Component } from 'react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled render error', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error-page">
          <div className="app-error-page__card card">
            <h1 className="app-error-page__title">משהו השתבש</h1>
            <p className="app-error-page__text">
              אירעה שגיאה בלתי צפויה. נסו לרענן את הדף או לחזור לדף הבית.
            </p>
            <div className="app-error-page__actions">
              <Button onClick={() => window.location.reload()}>רענון הדף</Button>
              <Button variant="secondary" onClick={this.handleReset}>חזרה לדף הבית</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
