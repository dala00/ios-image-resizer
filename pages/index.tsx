import Head from 'next/head'
import { ChangeEvent, useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [file, setFile] = useState(null as File | null)

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }

  async function resize() {
    if (file === null) {
      return
    }

    const params = new FormData()
    params.append('image', file)

    const response = await axios
      .post('/api/hello', params, {
        headers: {
          'content-type': 'multipart/form-data',
        },
      })
      .catch((error) => {
        console.error(error)
        return null
      })
    if (response === null) {
      return
    }
    console.log(response)
  }

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <input type="file" onChange={onFileChange}></input>
        <button type="button" onClick={() => resize()}>
          Submit
        </button>
      </main>

      <footer>aaa</footer>
    </div>
  )
}
