import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DropdownMenu,
  DropdownMenuCheckIcon,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { axePass, themedRender } from '@/test/utils';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
];

function Languages({ onChange }: { onChange?: (code: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button">Change language</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            data-lang={language.code}
            onSelect={() => onChange?.(language.code)}
          >
            {language.label}
            {language.code === 'en' && (
              <DropdownMenuCheckIcon className="absolute end-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('renders smoke with a trigger', () => {
    themedRender(<Languages />);
    expect(screen.getByText('Change language')).toBeInTheDocument();
  });

  it('opens on the trigger and lists every language item', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    const menu = await screen.findByRole('menu');
    const items = withinMenuItems(menu);
    expect(items).toHaveLength(LANGUAGES.length);
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Русский')).toBeInTheDocument();
  });

  it('gives the content the same rounded-lg radius the buttons use', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveClass('rounded-lg');
    expect(menu).toHaveClass('border-border');
    // Stacks above the fixed header bar (z-60) it can be anchored under.
    expect(menu).toHaveClass('z-90');
  });

  it('gives every item a comfortable activation target', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    const menu = await screen.findByRole('menu');
    for (const item of withinMenuItems(menu)) {
      expect(item).toHaveClass('min-h-12');
      expect(item).toHaveClass('rounded-sm');
    }
  });

  it('supports arrow-key navigation between items', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    await screen.findByRole('menu');
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /english/i })).toHaveFocus();
    });
    await user.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /العربية/ })).toHaveFocus();
    });
  });

  it('fires onSelect with the chosen locale and closes the menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    themedRender(<Languages onChange={onChange} />);
    await user.click(screen.getByText('Change language'));
    await user.click(await screen.findByRole('menuitem', { name: /Русский/ }));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('ru');
    });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('keeps text and surface classes identical in RTL', async () => {
    const user = userEvent.setup();
    const rtl = themedRender(
      <div dir="rtl" lang="ar">
        <Languages />
      </div>,
      { dir: 'rtl', lang: 'ar' },
    );
    expect(rtl.container.firstElementChild).toHaveAttribute('dir', 'rtl');
    await user.click(screen.getByText('Change language'));
    const menu = await screen.findByRole('menu');
    expect(menu.className).toContain('bg-card');
    expect(screen.getByText('العربية')).toBeInTheDocument();
  });

  it('has zero axe violations while open', async () => {
    const user = userEvent.setup();
    themedRender(<Languages />);
    await user.click(screen.getByText('Change language'));
    const menu = await screen.findByRole('menu');
    // Scoped to the menu: Radix's popper wrapper div sits outside any
    // landmark by design (the dialog landmark rule covers sheets, but menus
    // have no landmark role), so document-level scanning flags the wrapper.
    await axePass(menu);
  });
});

function withinMenuItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(
    menu.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]'),
  );
}
