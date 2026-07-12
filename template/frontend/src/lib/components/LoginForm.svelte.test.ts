import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import LoginForm from './LoginForm.svelte';

describe('LoginForm', () => {
	it('renders email and password inputs and a submit button', () => {
		render(LoginForm);
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
	});
});
