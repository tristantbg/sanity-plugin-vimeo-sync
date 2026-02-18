import { Box, Card, Code, Flex, Text } from '@sanity/ui'
import { useEffect, useRef } from 'react'

export function SyncLogs({ logs }) {
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  if (!logs || logs.length === 0) {
    return null
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'error':
        return 'critical'
      case 'warn':
        return 'caution'
      default:
        return 'default'
    }
  }

  return (
    <Card paddingX={3} paddingBottom={3}>
      <Card
        padding={3}
        tone="transparent"
        border
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <Flex direction="column" gap={2}>
          {logs.map((log, index) => (
            <Box key={index}>
              <Text size={1} style={{ color: 'var(--card-muted-fg-color)' }}>
                [{log.timestamp}]
              </Text>{' '}
              <Text size={1} tone={getLogColor(log.type)}>
                {log.message}
              </Text>
            </Box>
          ))}
          <div ref={endRef} />
        </Flex>
      </Card>
    </Card>
  )
}
