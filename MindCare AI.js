import React, { useState } from "react";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone, faPaperPlane } from "@fortawesome/free-solid-svg-icons";

const MentalHealthChatbot = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const API_KEY = process.env.REACT_APP_OPENAI_API_KEY; // 🔒 Secure API Key

  // 🎤 Speech-to-Text (Auto-send after recognition)
  const handleVoiceClick = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
      sendMessage(transcript); // ✅ Auto-send after speech recognition
    };

    recognition.onerror = () => setIsListening(false);
  };

  // 🔊 Text-to-Speech
  const handleTextToSpeech = (text) => {
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // 📩 Send Message to AI Chatbot
  const sendMessage = async (msg = message) => {
    if (!msg.trim()) return;
  
    setMessage(""); // Clear input field
    setChat((prevChat) => [...prevChat, { text: msg, sender: "user" }, { text: "Typing...", sender: "bot" }]);
  
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: msg }],
        }),
      });
  
      const data = await response.json();
  
      if (data.error) throw new Error(data.error.message);
  
      const botReply = data.choices?.[0]?.message?.content || "I'm here to listen. Tell me more.";
  
      setChat((prevChat) => [...prevChat.slice(0, -1), { text: botReply, sender: "bot" }]); // Replace "Typing..."
      handleTextToSpeech(botReply);
    } catch (error) {
      console.error("Error fetching chatbot response:", error);
      setChat((prevChat) => [...prevChat.slice(0, -1), { text: "Oops! Something went wrong.", sender: "bot" }]);
    }
  };
  
  
  return (
    <div className="chat-container">
      <h1 className="chat-header">AI Mental Health Chatbot</h1>

      <div className="chat-window">
        {chat.map((msg, index) => (
          <p key={index} className={msg.sender === "user" ? "user-message" : "bot-message"}>
            {msg.text}
          </p>
        ))}
      </div>

      {/* Quick Suggestions */}
      <div className="quick-suggestions">
        {["I'm feeling stressed", "Give me motivation", "I feel anxious", "How to relax?"].map((text, index) => (
          <button key={index} className="suggestion-button" onClick={() => sendMessage(text)}>
            {text}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage(message); // ✅ Send on Enter
          }}
        />
        <button className={`voice-button ${isListening ? "listening" : ""}`} onClick={handleVoiceClick}>
          <FontAwesomeIcon icon={faMicrophone} size="lg" />
        </button>
        <button className="send-button" onClick={() => sendMessage(message)}>
          <FontAwesomeIcon icon={faPaperPlane} size="lg" />
        </button>
      </div>
    </div>
  );
};

export default MentalHealthChatbot;
