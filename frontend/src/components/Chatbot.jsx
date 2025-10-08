import React, { useMemo, useState, useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../context/AppContext'

const Chatbot = () => {

    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I can help you get a basic idea of your issue. Briefly describe your symptoms.' }
    ])

    const specialityKeywords = useMemo(() => ([
        { keys: ['skin', 'rash', 'acne', 'itch', 'psoriasis', 'eczema'], speciality: 'Dermatologist' },
        { keys: ['headache', 'migraine', 'seizure', 'stroke', 'numb', 'dizzy', 'memory'], speciality: 'Neurologist' },
        { keys: ['stomach', 'abdomen', 'gas', 'ulcer', 'liver', 'ibs', 'nausea', 'vomit', 'diarrhea'], speciality: 'Gastroenterologist' },
        { keys: ['period', 'pregnan', 'fertility', 'pcos', 'pcod', 'pelvic', 'gyne'], speciality: 'Gynecologist' },
        { keys: ['child', 'kid', 'fever', 'pediatric', 'vaccine', 'cough'], speciality: 'Pediatricians' },
        { keys: ['fever', 'cough', 'cold', 'flu', 'fatigue', 'checkup', 'bp', 'diabetes'], speciality: 'General physician' }
    ]), [])

    const redFlags = useMemo(() => ([
        'chest pain', 'shortness of breath', 'severe bleeding', 'loss of consciousness', 'fainting', 'severe allergic', 'suicidal'
    ]), [])

    const analyze = (text) => {
        const lower = text.toLowerCase()

        const flagged = redFlags.find(flag => lower.includes(flag))
        if (flagged) {
            return {
                advice: 'This could be serious. If this is an emergency, please call your local emergency number or visit the nearest ER immediately.',
                speciality: 'General physician'
            }
        }

        const match = specialityKeywords.find(item => item.keys.some(k => lower.includes(k)))
        if (match) {
            return {
                advice: `Based on your description, you may consult a ${match.speciality}. I can take you to the ${match.speciality} list.`,
                speciality: match.speciality
            }
        }

        return {
            advice: 'I could not confidently map this. A General physician is a good starting point. I can take you there.',
            speciality: 'General physician'
        }
    }

    const { backendUrl } = useContext(AppContext)

    const send = async () => {
        if (!input.trim()) return
        const userMsg = input.trim()
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput('')
        try {
            const { data } = await axios.post(`${backendUrl}/api/ai/triage`, { message: userMsg })
            if (data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: data.reply, speciality: data.speciality }])
            } else {
                const result = analyze(userMsg)
                setMessages(prev => [...prev, { role: 'bot', text: result.advice, speciality: result.speciality }])
            }
        } catch (e) {
            const result = analyze(userMsg)
            setMessages(prev => [...prev, { role: 'bot', text: result.advice, speciality: result.speciality }])
        }
    }

    const goToSpeciality = (speciality) => {
        // navigate to speciality route; ensure it matches existing route param names
        navigate(`/doctors/${encodeURIComponent(speciality)}`)
        setOpen(false)
    }

    return (
        <div>
            {/* Floating button */}
            <button
                type='button'
                onClick={() => setOpen(!open)}
                className='fixed z-40 bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary flex items-center justify-center hover:opacity-90'
                aria-label='Open chatbot'
            >
                <img src={assets.chats_icon} alt='' className='w-7 h-7 invert' />
            </button>

            {open && (
                <div className='fixed z-40 bottom-24 right-6 w-80 max-w-[90vw] bg-white border rounded-xl shadow-xl flex flex-col overflow-hidden'>
                    <div className='bg-primary text-white px-4 py-2 text-sm font-medium'>AI Health Helper</div>
                    <div className='flex-1 max-h-96 overflow-y-auto p-3 space-y-2 text-sm text-[#333]'>
                        {messages.map((m, idx) => (
                            <div key={idx} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                                <div className={`inline-block px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-[#EAEFFF] text-[#333]' : 'bg-gray-100'}`}>
                                    {m.text}
                                </div>
                                {m.role === 'bot' && m.speciality && (
                                    <div className='mt-2'>
                                        <button onClick={() => goToSpeciality(m.speciality)} className='text-xs px-3 py-1 border rounded hover:bg-primary hover:text-white transition'>View {m.speciality} Doctors</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className='flex items-center gap-2 p-2 border-t'>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                            className='flex-1 border rounded px-3 py-2 text-sm outline-primary'
                            placeholder='Describe your symptoms...'
                        />
                        <button onClick={send} className='bg-primary text-white px-3 py-2 rounded'>Send</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Chatbot


