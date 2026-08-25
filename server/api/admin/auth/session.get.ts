import { requireActiveAdmin } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireActiveAdmin(event)
    return {
      authenticated: true,
      user: {
        userId: admin.userId,
        email: admin.email,
        role: admin.role
      }
    }
  } catch (err: any) {
    return {
      authenticated: false,
      user: null
    }
  }
})
