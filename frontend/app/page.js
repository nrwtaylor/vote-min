'use client'
import { useRouter } from 'next/navigation'
import { api } from './lib'
import Kept from './Kept'

export default function Home() {
  const router = useRouter()
  const create = async () => router.push('/manage/' + (await api('/polls', { method: 'POST' })).manageId)
  return <>
    <h1>vote-min</h1>
    <p className="lede">One question. One ballot each.</p>
    <p>Write a question, share a link, and voters ask for a ballot with a name or number. Each can vote once. You see who has voted, never how.</p>
    <button onClick={create}>Create vote</button>
    <Kept who="manager" />
  </>
}
