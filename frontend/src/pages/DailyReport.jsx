import React, { useState } from "react";
import { useParams } from "react-router-dom";

function DailyReport() {
  const { date } = useParams();

  const today = new Date().toISOString().split("T")[0];
  const isPastDate = date < today;

  const [morningText, setMorningText] = useState("");
  const [eveningText, setEveningText] = useState("");

  const [morningPhotos, setMorningPhotos] = useState([]);
  const [eveningPhotos, setEveningPhotos] = useState([]);

  const [showMorningPreview, setShowMorningPreview] = useState(false);
  const [showEveningPreview, setShowEveningPreview] = useState(false);

  const [listening, setListening] = useState(false);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const startListening = (setText) => {
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; 
    recognition.start();

    setListening(true);

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setText((prev) => prev + " " + speechText);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  const handleMorningPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) return alert("Max 4 photos allowed");
    setMorningPhotos(files);
  };

  const handleEveningPhotos = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) return alert("Max 4 photos allowed");
    setEveningPhotos(files);
  };

  const handleSubmit = () => {
    alert("Report Saved");
  };

  if (isPastDate) {
    return (
      <div style={{ padding: 40, marginTop: 80, color: "white" }}>
        <h1>Daily Report — {date}</h1>
        <h2 style={{ color: "red" }}>
          Past date report fill nahi kar sakte
        </h2>
      </div>
    );
  }

  const micStyle = {
    width: 55,
    height: 55,
    borderRadius: "50%",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    background: listening ? "red" : "#007bff",
    color: "white",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    marginTop: 10
  };

  return (
    <div style={{ padding: 20, marginTop: "80px", color: "white" }}>
      <h1>Daily Report — {date}</h1>

      <hr />

    
      <h2>Morning Update</h2>

      <input type="file" multiple accept="image/*" onChange={handleMorningPhotos} />

      <textarea
        placeholder="Morning work details..."
        value={morningText}
        onChange={(e) => setMorningText(e.target.value)}
        style={{ width: "100%", height: 100, marginTop: 10 }}
      />

      <div>
        <button
          style={micStyle}
          onClick={() => startListening(setMorningText)}
        >
          🎤
        </button>
        {listening && <p>Listening...</p>}
      </div>

      <p>Selected Photos: {morningPhotos.length}</p>

      {(morningPhotos.length > 0 || morningText) && (
        <button onClick={() => setShowMorningPreview(!showMorningPreview)}>
          View Morning Preview
        </button>
      )}

      {showMorningPreview && (
        <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {morningPhotos.map((file, i) => (
              <img
                key={i}
                src={URL.createObjectURL(file)}
                alt=""
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
              />
            ))}
          </div>

          {morningText && (
            <div style={{ background: "#222", padding: 10, marginTop: 10 }}>
              <b>Text Preview:</b>
              <p>{morningText}</p>
            </div>
          )}
        </div>
      )}

      <hr />

      <h2>Evening Update</h2>

      <input type="file" multiple accept="image/*" onChange={handleEveningPhotos} />

      <textarea
        placeholder="Evening work details..."
        value={eveningText}
        onChange={(e) => setEveningText(e.target.value)}
        style={{ width: "100%", height: 100, marginTop: 10 }}
      />

    
      <div>
        <button
          style={micStyle}
          onClick={() => startListening(setEveningText)}
        >
          🎤
        </button>
        {listening && <p>Listening...</p>}
      </div>

      <p>Selected Photos: {eveningPhotos.length}</p>

      {(eveningPhotos.length > 0 || eveningText) && (
        <button onClick={() => setShowEveningPreview(!showEveningPreview)}>
          View Evening Preview
        </button>
      )}

      {showEveningPreview && (
        <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {eveningPhotos.map((file, i) => (
              <img
                key={i}
                src={URL.createObjectURL(file)}
                alt=""
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
              />
            ))}
          </div>

          {eveningText && (
            <div style={{ background: "#222", padding: 10, marginTop: 10 }}>
              <b>Text Preview:</b>
              <p>{eveningText}</p>
            </div>
          )}
        </div>
      )}

      <br /><br />

      <button
        onClick={handleSubmit}
        style={{
          padding: "12px 25px",
          background: "green",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 16
        }}
      >
        Save Report
      </button>
    </div>
  );
}

export default DailyReport;
