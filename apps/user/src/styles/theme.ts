import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Green theme for AJOTI ROSCA
const primary: MantineColorsTuple = [
  '#E6F4EF',
  '#C9F7D8',
  '#9CF2BA',
  '#6EE89D',
  '#41D980',
  '#0B6B55',
  '#095C49',
  '#074D3D',
  '#053E31',
  '#032F25',
]

export const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary,
  },
  fontFamily:
    'Poppins, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      'Poppins, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
    Input: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
})

