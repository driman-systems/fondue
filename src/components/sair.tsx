"use client"

import { signOut } from "next-auth/react"
import { FiLogOut } from "react-icons/fi"

const Sair = ()=> {

    const sair = ()=> {
    signOut({callbackUrl: "/login"})
  }

    return (
        <button onClick={sair} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <FiLogOut className="text-xl" /> Sair
        </button>
    )
}

export default Sair