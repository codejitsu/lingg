import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HistoryLinks from './HistoryLinks.component'
import type { StoryInterface } from '@/models/Story.Interface'
import { SidebarProvider } from '@/components/ui/sidebar'

// TODO test new story, the lable must be shown

describe('HistoryLinks.component: rendering', () => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
        }),
    })

    it('renders without crashing', () => {
        render(<HistoryLinks stories={[]} hidden={false} />)
    })

    it('displays history links when provided', () => {
        const stories: StoryInterface[] = [
            {
                storyId: '1',
                title: 'Story 1',
                startedAt: new Date().toISOString(),
            },
            {
                storyId: '2',
                title: 'Story 2',
                startedAt: new Date().toISOString(),
            },
        ]

        render(
            <SidebarProvider>
                <HistoryLinks stories={stories} hidden={false} />
            </SidebarProvider>,
        )
        expect(screen.getByText('Story 1')).toBeInTheDocument()
        expect(screen.getByText('Story 2')).toBeInTheDocument()
    })

    it('each link navigates to the correct URL', () => {
        const stories: StoryInterface[] = [
            {
                storyId: '1',
                title: 'Story 1',
                startedAt: new Date().toISOString(),
            },
            {
                storyId: '2',
                title: 'Story 2',
                startedAt: new Date().toISOString(),
            },
        ]

        render(
            <SidebarProvider>
                <HistoryLinks stories={stories} hidden={false} />
            </SidebarProvider>,
        )
        const link1 = screen.getByText('Story 1').closest('a')
        expect(link1).toHaveAttribute('href', '/#/story/1')

        const link2 = screen.getByText('Story 2').closest('a')
        expect(link2).toHaveAttribute('href', '/#/story/2')
    })

    it('shows New label for the new story', () => {
        const stories: StoryInterface[] = [
            {
                storyId: '1',
                title: 'Story 1',
                startedAt: new Date().toISOString(),
            },
            {
                storyId: '2',
                title: 'Story 2',
                startedAt: new Date().toISOString(),
            },
        ]

        render(
            <SidebarProvider>
                <HistoryLinks stories={stories} hidden={false} newStoryId="1" />
            </SidebarProvider>,
        )
        expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('hides New label for the new story', () => {
        const stories: StoryInterface[] = [
            {
                storyId: '1',
                title: 'Story 1',
                startedAt: new Date().toISOString(),
            },
            {
                storyId: '2',
                title: 'Story 2',
                startedAt: new Date().toISOString(),
            },
        ]

        render(
            <SidebarProvider>
                <HistoryLinks stories={stories} hidden={true} newStoryId="1" />
            </SidebarProvider>,
        )
        expect(screen.queryByText('New')).not.toBeInTheDocument()
    })
})
