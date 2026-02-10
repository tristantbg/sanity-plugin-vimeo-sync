import { Card, Text } from '@sanity/ui'

export function field(props) {
  const { children, title, description, value = '' } = props
  return (
    <Card padding={2}>
      <Card paddingY={2} tone="inherit">
        <Text size={1} weight="semibold">
          {title}
        </Text>
      </Card>
      <Card paddingTop={1} paddingBottom={2} tone="inherit">
        <Text size={1} muted>
          {description}
        </Text>
      </Card>
      <Card tone="inherit">{children}</Card>
    </Card>
  )
}
