import React, { useState, useRef } from "react";
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Mammoth from 'mammoth';

const Mailbox = () => {
    const [sending, setSending] = useState(false);
    const [data, setData] = useState([]);
    const [fileError, setFileError] = useState("");
    const [fileContent, setFileContent] = useState('');
    const [emailcount, setemailcount] = useState(false);
    const fileInputRef = useRef(null);
    const navigation = useNavigate();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const emailList = XLSX.utils.sheet_to_json(sheet, { header: 1 }).flat();

                console.log("Raw Sheet Data:", XLSX.utils.sheet_to_json(sheet, { header: 1 }));
                console.log("Extracted Email List Before Filtering:", emailList);

                const totalEmails = emailList
                    .map(email => (typeof email === 'string' ? email.trim() : ""))
                    .filter(email => validateEmail(email));

                console.log("Valid Emails After Filtering:", totalEmails);

                setData(totalEmails);
                setemailcount(true);
                setFileError("");
            } catch (error) {
                setFileError("Error reading the file. Please ensure it is a valid Excel file.");
            }
        };

        reader.onerror = () => {
            setFileError("Error reading the file. Please try again.");
        };

        reader.readAsBinaryString(file);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = re.test(String(email).trim());
        if (!isValid) console.log("Invalid Email Found:", email);
        return isValid;
    };

    const send = async () => {
        if (fileContent === "") {
            alert("Kindly enter a message");
            return;
        }

        if (data.length === 0) {
            alert("No valid email addresses found.");
            return;
        }

        setSending(true);
        try {
            console.log("Sending to:", data);
            const response = await axios.post("https://email-app-9dmm.onrender.com/sendemail", { msg: fileContent, email: data });
            console.log(response.data);

            if (response.data) {
                alert("Email sent successfully");
                setFileContent("");
                setData([]);
                setemailcount(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }
            } else {
                alert("Failed to send");
            }
        } catch (error) {
            alert("Failed to send. Please try again later.");
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigation('/');
    };

    return (
        <div className="bg-black">
            <div className="py-5 text-3xl font-bold text-center text-white bg-black">
                <h1>Bulk Email Send Application</h1>
            </div>

            <div className="py-5 text-2xl font-medium text-center text-white bg-blue-700">
                <h1>You can send multiple emails using this application</h1>
            </div>

            <div className="flex flex-col items-center gap-5 py-5 text-xl font-medium text-center text-black bg-blue-200">
                <h2>Upload Word File or you can type</h2>
                <input className="p-2 border border-black border-solid" ref={fileInputRef} onChange={handleFile} type="file" />
                {fileError && <p className="text-red-500">{fileError}</p>}
                <p>Total Emails: {emailcount ? data.length : "0"}</p>
                <button onClick={send} className="px-10 py-3 text-xl font-normal text-white bg-black" type="button" disabled={sending}>
                    {sending ? "Sending..." : "Send"}
                </button>
                <button onClick={handleLogout} className="px-10 py-3 text-xl font-normal text-white bg-red-500" type="button">
                    Logout
                </button>
            </div>

            <div className="py-5 text-xs font-medium text-center text-white bg-black">
                <h1>Copyrights @abc</h1>
            </div>
        </div>
    );
};

export default Mailbox;
