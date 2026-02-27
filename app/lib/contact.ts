export interface ContactPayload {
  name: string
  email: string
  message: string
  company?: string
}

export interface ContactResult {
  ok: boolean
  message: string
}

const LOCAL_COOLDOWN_KEY = 'combocv:contact:lastSubmit'
const COOLDOWN_MS = 10_000

function underCooldown(): boolean {
  const raw = window.localStorage.getItem(LOCAL_COOLDOWN_KEY)

  if (!raw) {
    return false
  }

  const lastSubmit = Number(raw)

  if (Number.isNaN(lastSubmit)) {
    return false
  }

  return Date.now() - lastSubmit < COOLDOWN_MS
}

function setCooldown(): void {
  window.localStorage.setItem(LOCAL_COOLDOWN_KEY, String(Date.now()))
}

export async function submitContact(payload: ContactPayload): Promise<ContactResult> {
  if (underCooldown()) {
    return {
      ok: false,
      message: 'Please wait a few seconds before sending another message.',
    }
  }

  const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT

  if (!endpoint) {
    return {
      ok: true,
      message: 'Contact endpoint is not configured yet. Reach out by email for now.',
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return {
        ok: false,
        message: 'Unable to send your message right now. Please try again shortly.',
      }
    }

    setCooldown()

    return {
      ok: true,
      message: 'Message sent. Thanks for reaching out.',
    }
  } catch {
    return {
      ok: false,
      message: 'Network error while sending message. Please try again.',
    }
  }
}
