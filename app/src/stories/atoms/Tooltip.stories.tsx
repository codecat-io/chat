import type { Meta, StoryObj } from '@storybook/react';
 
import '../../styles.ts';
import { Tooltip } from '../../js/components/atoms/Tooltip';

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
};
 
export default meta;
type Story = StoryObj<typeof Tooltip>;
 
export const Primary: Story = {
  args: {
    text: 'Tooltip text',
    children: 'Hover over',
  },
};
