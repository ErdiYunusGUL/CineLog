import { useState, useRef, useEffect } from 'react';
import api from '../api';

function CineBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ text: "Merhaba! Ben CineBot. Sana bugün hangi filmi veya diziyi önermemi istersin?", isBot: true }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post('/Ai/chat', { message: userMsg });
            setMessages(prev => [...prev, { text: res.data.response, isBot: true }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Üzgünüm, şu an bağlantı kuramıyorum.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1050 }}>
            {/* Sohbet Balonu Butonu */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="btn btn-danger rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                    style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-robot fs-3"></i>
                </button>
            )}

            {/* Chat Penceresi */}
            {isOpen && (
                <div className="card shadow-lg border-secondary" style={{ width: '350px', height: '450px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                        <div>
                            <i className="bi bi-robot me-2"></i> CineBot AI
                        </div>
                        <button className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
                    </div>

                    {/* Messages Area */}
                    <div className="card-body overflow-auto" style={{ flex: 1, padding: '10px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`d-flex mb-3 ${msg.isBot ? 'justify-content-start' : 'justify-content-end'}`}>
                                <div className={`p-2 rounded ${msg.isBot ? 'bg-dark text-light border border-secondary' : 'bg-danger text-white'}`} style={{ maxWidth: '85%', fontSize: '0.9rem' }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="d-flex mb-3 justify-content-start">
                                <div className="p-2 rounded bg-dark text-light border border-secondary">
                                    <span className="spinner-grow spinner-grow-sm me-1 text-danger" role="status"></span>
                                    Düşünüyor...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="card-footer bg-dark border-secondary p-2">
                        <form onSubmit={handleSend} className="d-flex">
                            <input 
                                type="text" 
                                className="form-control form-control-sm bg-dark text-light border-secondary me-2" 
                                placeholder="Film sor..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <button type="submit" className="btn btn-danger btn-sm" disabled={isLoading || !input.trim()}>
                                <i className="bi bi-send"></i>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CineBot;
