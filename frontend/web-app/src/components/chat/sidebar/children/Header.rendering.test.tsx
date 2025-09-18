import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Header from './Header.component'

describe('Header.component: rendering', () => {
    it('renders correctly', () => {
        render(<Header title="test name" />)
        expect(screen.getByText('test name')).toBeInTheDocument()
    })

    it('header link navigates to correct URL', () => {
        const { container } = render(<Header title="lingg.ai" />)
        expect(container.querySelector('a')?.getAttribute('href')).toBe('/#/')
    })    
})
