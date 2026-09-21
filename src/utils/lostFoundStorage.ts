import { validateLostComment, validateLostPost } from './lostFound'
import type { LostComment, LostPost, LostPostDraft } from './lostFound'

const DATABASE = 'yufesta-lost-found'
const STORE = 'posts'
const COMMENTS = 'comments'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2)
    let blocked = false
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' })
      if (!request.result.objectStoreNames.contains(COMMENTS)) {
        const comments = request.result.createObjectStore(COMMENTS, { keyPath: 'id' })
        comments.createIndex('postId', 'postId')
      }
    }
    request.onerror = () => reject(new Error('브라우저 저장소를 열 수 없어요. 브라우저의 저장 공간 설정을 확인해 주세요.'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('다른 탭의 분실물 화면을 닫고 다시 시도해 주세요.'))
    }
    request.onsuccess = () => {
      if (blocked) { request.result.close(); return }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
  })
}

export async function loadLostPostDetail(postId: string): Promise<{ post: LostPost | undefined; comments: LostComment[] }> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE, COMMENTS], 'readonly')
    const post = transaction.objectStore(STORE).get(postId)
    const comments = transaction.objectStore(COMMENTS).index('postId').getAll(postId)
    transaction.oncomplete = () => {
      database.close()
      resolve({ post: post.result, comments: (comments.result as LostComment[]).sort((a, b) => a.createdAt - b.createdAt) })
    }
    transaction.onabort = () => {
      database.close()
      reject(new Error('게시글과 댓글을 불러오지 못했어요. 다시 시도해 주세요.'))
    }
  })
}

export async function saveLostComment(postId: string, content: string): Promise<LostComment> {
  const validation = validateLostComment(content)
  if (validation) throw new Error(validation)
  const comment: LostComment = { id: crypto.randomUUID(), postId, content: content.trim(), createdAt: Date.now() }
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE, COMMENTS], 'readwrite')
    const post = transaction.objectStore(STORE).get(postId)
    let missingPost = false
    post.onsuccess = () => {
      if (!post.result) { missingPost = true; transaction.abort(); return }
      transaction.objectStore(COMMENTS).add(comment)
    }
    transaction.oncomplete = () => { database.close(); resolve(comment) }
    transaction.onabort = () => {
      database.close()
      reject(new Error(missingPost ? '게시글을 찾을 수 없어 댓글을 등록하지 못했어요.' : '댓글을 저장하지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.'))
    }
  })
}

export async function loadLostPosts(): Promise<LostPost[]> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly')
    const request = transaction.objectStore(STORE).getAll()
    transaction.oncomplete = () => {
      database.close()
      resolve((request.result as LostPost[]).sort((a, b) => b.createdAt - a.createdAt))
    }
    transaction.onabort = () => {
      database.close()
      reject(new Error('게시글을 불러오지 못했어요. 다시 시도해 주세요.'))
    }
  })
}

export async function saveLostPost(draft: LostPostDraft): Promise<LostPost> {
  const validation = validateLostPost(draft)
  if (validation) throw new Error(validation)
  const post: LostPost = {
    ...draft, title: draft.title.trim(), location: draft.location.trim(), content: draft.content.trim(),
    id: crypto.randomUUID(), createdAt: Date.now(),
  }
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).add(post)
    // Only show success after the entire post, including its photos, is committed.
    transaction.oncomplete = () => { database.close(); resolve(post) }
    transaction.onabort = () => {
      database.close()
      reject(new Error('게시글을 저장하지 못했어요. 브라우저 저장 공간을 확인하거나 사진 수를 줄여 다시 시도해 주세요.'))
    }
  })
}
