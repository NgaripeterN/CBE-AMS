import { render, screen, fireEvent } from '@testing-library/react';
import AdminLayout from './AdminLayout';
import { AuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockLogout = jest.fn();

const mockUseRouter = {
  pathname: '/admin',
  push: jest.fn(),
};

const renderWithAuth = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <AuthContext.Provider {...providerProps}>{ui}</AuthContext.Provider>,
    renderOptions
  );
};

describe('AdminLayout', () => {
  beforeEach(() => {
    useRouter.mockReturnValue(mockUseRouter);
  });

  it('toggles sidebar on desktop', () => {
    const providerProps = {
      value: { user: { role: 'admin' }, logout: mockLogout },
    };

    renderWithAuth(<AdminLayout><div>Admin Content</div></AdminLayout>, { providerProps });

    const toggleButton = screen.getByLabelText('Toggle Sidebar');
    const sidebar = toggleButton.closest('aside');

    expect(sidebar).not.toHaveClass('md:w-20');

    fireEvent.click(toggleButton);

    expect(sidebar).toHaveClass('md:w-20');

    fireEvent.click(toggleButton);

    expect(sidebar).not.toHaveClass('md:w-20');
  });
});
