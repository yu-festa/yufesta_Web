import assert from 'node:assert/strict'
import { test } from 'node:test'
import { composeLostItemDescription, formatLostItemTime, splitLostItemDescription } from '../src/utils/lostItemDisplay.ts'

test('기존 게시판의 제목·내용을 서버 설명 한 필드로 저장하고 다시 구분한다', () => {
  const description = composeLostItemDescription('검은 지갑', '중앙 무대 앞에서 잃어버렸어요')
  assert.equal(description, '검은 지갑\n중앙 무대 앞에서 잃어버렸어요')
  assert.deepEqual(splitLostItemDescription(description), { title: '검은 지갑', body: '중앙 무대 앞에서 잃어버렸어요' })
  assert.deepEqual(splitLostItemDescription('서버에 등록된 기존 물건 설명'), { title: '서버에 등록된 기존 물건 설명', body: '' })
  assert.throws(() => composeLostItemDescription('제목', '가'.repeat(100)), /100자/)
})

test('서버 KST 시각을 기존 게시판의 상대 시간으로 표시한다', () => {
  assert.equal(formatLostItemTime('2026-10-02T14:00:00', Date.parse('2026-10-02T14:10:00+09:00')), '10분 전')
})
