import { useChatStore } from './chatStore'

beforeEach(() => {
  useChatStore.setState({ messages: [] })
})

test('addMessage appends a message', () => {
  useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hello' })
  expect(useChatStore.getState().messages).toHaveLength(1)
  expect(useChatStore.getState().messages[0].content).toBe('Hello')
})

test('appendToLast appends chunk to last message', () => {
  useChatStore.getState().addMessage({ id: '1', role: 'assistant', content: 'Hel', streaming: true })
  useChatStore.getState().appendToLast('lo world')
  expect(useChatStore.getState().messages[0].content).toBe('Hello world')
})

test('setLastStreaming updates streaming flag', () => {
  useChatStore.getState().addMessage({ id: '1', role: 'assistant', content: '', streaming: true })
  useChatStore.getState().setLastStreaming(false)
  expect(useChatStore.getState().messages[0].streaming).toBe(false)
})

test('clear removes all messages', () => {
  useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi' })
  useChatStore.getState().clear()
  expect(useChatStore.getState().messages).toHaveLength(0)
})
