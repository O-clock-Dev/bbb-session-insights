"use client"
import useSWR from 'swr'
import {CopyToClipboard} from 'react-copy-to-clipboard'
 
const fetcher = (...args) => fetch(...args).then((res) => res.json())
 
export default function TeleporterKey() {
  const { data, error } = useSWR('/api/generate-old-teleporter-key', fetcher, {
    revalidateOnFocus: false, 
    revalidateOnReconnect:false, 
    revalidateIfStale:false })
 
  if (error) return <div>Failed to load</div>
  if (!data) return (
  <div className="animate-spin inline-block size-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
    <span className='sr-only'>Chargement en cours...</span>
    </div>
  )
 
  return (
    <div className='flex-col items-center inline-flex'>
      <h1>Votre clé d&apos;activation est la suivante: </h1>
      <code className='text-sm sm:text-base inline-flex mt-2 justify-left items-center bg-cyan-800 text-white rounded-lg p-4 pl-6'>
        {data.activation_key}
        <CopyToClipboard text={data.activation_key}>
          <button className='bg-transparent hover:bg-cyan-600 ml-1' title='Copier dans le presse-papier' aria-label='Copier dans le presse-papier'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M10.986 3H12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1.014A2.25 2.25 0 0 1 7.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM9.5 4v-.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z" clip-rule="evenodd" />
          </svg>

          </button>
        </CopyToClipboard>
      </code>
    </div>
  )
}
