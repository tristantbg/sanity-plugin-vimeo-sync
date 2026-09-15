import {Card, Flex, Text} from '@sanity/ui'
import {useEffect, useRef} from 'react'

export function SyncLogs({logs}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  if (!logs || logs.length === 0) {
    return null
  }

  return (
    <Card paddingX={3} paddingBottom={3}>
      <Card
        padding={3}
        tone="default"
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
          {logs.map((log) => (
            <Card key={log.id}>
              <Text size={1}>{log.message}</Text>
            </Card>
          ))}
        </Flex>
      </Card>
    </Card>
  )
}
