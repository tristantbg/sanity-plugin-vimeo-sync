import { Box, Card, Code, Flex, Text } from '@sanity/ui'
import { useEffect, useRef } from 'react'

export function SyncLogs({ logs }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
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
        ref={containerRef}
      >
        <Flex direction="column" gap={2}>
          {logs.map((log, index) => (
            <Box key={index}>
              <Text size={1} tone={getLogColor(log.type)}>
                {log.message}
              </Text>
            </Box>
          ))}
        </Flex>
      </Card>
    </Card>
  )
}
