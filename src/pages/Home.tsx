import { Title, Text, Card, Group, Button, Stack } from '@mantine/core'

export function Home() {
  return (
    <div className="mx-auto max-w-4xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Welcome to Ajoti</Title>
          <Text c="dimmed" mt="xs">
            Your fintech application is ready to be built.
          </Text>
        </div>

        <Card withBorder>
          <Stack gap="md">
            <Title order={3}>Getting Started</Title>
            <Text size="sm">
              This is a minimal boilerplate with React, TypeScript, Mantine UI, and Tailwind CSS.
              Start building your features by adding components and pages.
            </Text>
            <Group>
              <Button variant="filled">Primary Action</Button>
              <Button variant="outline">Secondary Action</Button>
            </Group>
          </Stack>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card withBorder>
            <Title order={4} mb="xs">
              Mantine UI
            </Title>
            <Text size="sm" c="dimmed">
              A fully featured React component library with hooks and utilities.
            </Text>
          </Card>

          <Card withBorder>
            <Title order={4} mb="xs">
              Tailwind CSS
            </Title>
            <Text size="sm" c="dimmed">
              Utility-first CSS framework for rapid UI development.
            </Text>
          </Card>
        </div>
      </Stack>
    </div>
  )
}
