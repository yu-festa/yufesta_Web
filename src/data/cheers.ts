export type Cheer = {
  id: number
  author: string
  message: string
}

const messages = [
  '오늘 무대 서는 모두 화이팅!! 축제 끝까지 즐겨요!',
  '기다렸던 축제라 더 설레요. 다 같이 신나게 놀아요!',
  '멋진 공연 준비해 주셔서 감사합니다. 모두 응원해요!',
  '친구들과 오래 기억할 수 있는 축제가 되길 바라요!',
  '오늘의 주인공은 우리 모두! 안전하고 즐겁게 놀아요!',
]

// API 연결 전 전체 목록과 스크롤 동작을 확인하기 위한 예시 응원입니다.
export const initialCheers: Cheer[] = Array.from({ length: 128 }, (_, index) => ({
  id: 128 - index,
  author: index % 4 === 0 ? '푸른 푸르미' : index % 4 === 1 ? '영대 축제지기' : index % 4 === 2 ? '익명의 응원단' : '천마인',
  message: messages[index % messages.length],
}))
