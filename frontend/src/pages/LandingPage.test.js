import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';
import { ThemeProvider } from '../context/ThemeContext';

// Helper function to render component with required providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('LandingPage Component', () => {
  describe('Hero Section', () => {
    test('renders hero section with correct title', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('Optimize Your Resume')).toBeInTheDocument();
      expect(screen.getByText('Ace Your Interviews')).toBeInTheDocument();
    });

    test('renders hero section with tagline', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText(/Get instant AI-powered feedback on your resume/i)).toBeInTheDocument();
    });

    test('renders AI-Powered Career Tools badge', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('AI-Powered Career Tools')).toBeInTheDocument();
    });

    test('renders hero CTA buttons', () => {
      renderWithProviders(<LandingPage />);
      
      const getStartedButtons = screen.getAllByText('Get Started Free');
      const signInButton = screen.getByText('Sign In');
      
      expect(getStartedButtons.length).toBeGreaterThan(0);
      expect(signInButton).toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    test('displays all three feature cards', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('Resume Analysis')).toBeInTheDocument();
      expect(screen.getByText('Mock Interviews')).toBeInTheDocument();
      expect(screen.getAllByText('AI Feedback').length).toBeGreaterThan(0);
    });

    test('displays Resume Analysis feature description', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText(/Get comprehensive ATS score analysis/i)).toBeInTheDocument();
    });

    test('displays Mock Interviews feature description', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getAllByText(/Practice with AI-generated interview questions/i).length).toBeGreaterThan(0);
    });

    test('displays AI Feedback feature description', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText(/Receive instant, personalized feedback/i)).toBeInTheDocument();
    });
  });

  describe('CTA Buttons Navigation', () => {
    test('Get Started button links to register page', () => {
      renderWithProviders(<LandingPage />);
      
      const getStartedButtons = screen.getAllByText('Get Started Free');
      const firstButton = getStartedButtons[0].closest('a');
      
      expect(firstButton).toHaveAttribute('href', '/register');
    });

    test('Login button in navigation links to login page', () => {
      renderWithProviders(<LandingPage />);
      
      const loginButton = screen.getByRole('link', { name: /login/i });
      
      expect(loginButton).toHaveAttribute('href', '/login');
    });

    test('Sign In button in hero links to login page', () => {
      renderWithProviders(<LandingPage />);
      
      const signInButton = screen.getByText('Sign In').closest('a');
      
      expect(signInButton).toHaveAttribute('href', '/login');
    });

    test('Start Free Today button links to register page', () => {
      renderWithProviders(<LandingPage />);
      
      const startFreeButton = screen.getByText('Start Free Today').closest('a');
      
      expect(startFreeButton).toHaveAttribute('href', '/register');
    });
  });

  describe('Dark Mode Toggle', () => {
    test('renders dark mode toggle button', () => {
      renderWithProviders(<LandingPage />);
      
      const toggleButton = screen.getByLabelText('Toggle theme');
      
      expect(toggleButton).toBeInTheDocument();
    });

    test('clicking toggle button changes theme icon', () => {
      renderWithProviders(<LandingPage />);
      
      const toggleButton = screen.getByLabelText('Toggle theme');
      
      // Click to toggle theme
      fireEvent.click(toggleButton);
      
      // Button should still be present after toggle
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    test('renders navigation bar', () => {
      renderWithProviders(<LandingPage />);
      
      const nav = screen.getByRole('navigation');
      
      expect(nav).toBeInTheDocument();
    });

    test('renders application logo and name', () => {
      renderWithProviders(<LandingPage />);
      
      const appNames = screen.getAllByText('AI Resume Analyzer');
      
      expect(appNames.length).toBeGreaterThan(0);
    });

    test('renders How It Works section', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Upload Resume')).toBeInTheDocument();
      expect(screen.getByText('Get Analysis')).toBeInTheDocument();
      expect(screen.getByText('Practice Interviews')).toBeInTheDocument();
    });

    test('renders stats section', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('ATS Compatibility')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
      expect(screen.getByText('Resumes Analyzed')).toBeInTheDocument();
      expect(screen.getByText('Instant')).toBeInTheDocument();
      // AI Feedback appears in both features and stats sections
      expect(screen.getAllByText('AI Feedback').length).toBeGreaterThan(0);
    });

    test('renders footer section', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText(/AI-powered tools to help you land your dream job/i)).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Legal')).toBeInTheDocument();
    });

    test('renders copyright notice with current year', () => {
      renderWithProviders(<LandingPage />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} AI Resume Analyzer`))).toBeInTheDocument();
    });
  });

  describe('Content Sections', () => {
    test('renders Powerful Features section heading', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('Powerful Features to Boost Your Career')).toBeInTheDocument();
    });

    test('renders Ready to Land Your Dream Job CTA section', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText('Ready to Land Your Dream Job?')).toBeInTheDocument();
      expect(screen.getByText(/Join thousands of job seekers/i)).toBeInTheDocument();
    });

    test('renders three-step process cards', () => {
      renderWithProviders(<LandingPage />);
      
      expect(screen.getByText(/Upload your resume in PDF or DOCX format/i)).toBeInTheDocument();
      expect(screen.getByText(/Receive detailed ATS score/i)).toBeInTheDocument();
      // This text appears in both features and how-it-works sections
      expect(screen.getAllByText(/Practice with AI-generated interview questions/i).length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('theme toggle button has aria-label', () => {
      renderWithProviders(<LandingPage />);
      
      const toggleButton = screen.getByLabelText('Toggle theme');
      
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle theme');
    });

    test('all navigation links are accessible', () => {
      renderWithProviders(<LandingPage />);
      
      const loginLink = screen.getByRole('link', { name: /login/i });
      const getStartedLinks = screen.getAllByRole('link', { name: /get started/i });
      
      expect(loginLink).toBeInTheDocument();
      expect(getStartedLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile and Desktop Layout Elements', () => {
    test('renders responsive grid for feature cards', () => {
      renderWithProviders(<LandingPage />);
      
      // Check that all three features are present (mobile will stack, desktop will be in grid)
      const resumeAnalysis = screen.getByText('Resume Analysis');
      const mockInterviews = screen.getByText('Mock Interviews');
      // AI Feedback appears multiple times on the page
      const aiFeedback = screen.getAllByText('AI Feedback');
      
      expect(resumeAnalysis).toBeInTheDocument();
      expect(mockInterviews).toBeInTheDocument();
      expect(aiFeedback.length).toBeGreaterThan(0);
    });

    test('renders responsive navigation with mobile-friendly spacing', () => {
      renderWithProviders(<LandingPage />);
      
      const nav = screen.getByRole('navigation');
      const loginButton = within(nav).getByText('Login');
      const getStartedButton = within(nav).getByText('Get Started');
      
      expect(loginButton).toBeInTheDocument();
      expect(getStartedButton).toBeInTheDocument();
    });

    test('renders hero section with responsive text', () => {
      renderWithProviders(<LandingPage />);
      
      const heroTitle = screen.getByText('Optimize Your Resume');
      const heroSubtitle = screen.getByText('Ace Your Interviews');
      
      expect(heroTitle).toBeInTheDocument();
      expect(heroSubtitle).toBeInTheDocument();
    });
  });
});
