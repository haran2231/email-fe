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
    const [emailCount, setEmailCount] = useState(0);
    const [excelData, setExcelData] = useState([]);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const emailList = XLSX.utils.sheet_to_json(sheet, { header: 'A' });
                const validEmails = emailList.map(item => item.A).filter(email => validateEmail(email));
                setData(validEmails);
                setEmailCount(validEmails.length);
                setExcelData(XLSX.utils.sheet_to_json(sheet));
                setFileError("");
            } catch (error) {
                setFileError("Error reading the file. Please ensure it is a valid Excel file.");
            }
        };
        reader.onerror = () => setFileError("Error reading the file. Please try again.");
        reader.readAsBinaryString(file);
    };

    const handleWordFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const result = await Mammoth.extractRawText({ arrayBuffer });
                setFileContent(result.value);
            } catch (error) {
                setFileError("Error processing the file. Ensure it's a valid .docx file.");
            }
        };
        reader.onerror = () => setFileError("Error reading the file. Please try again.");
        reader.readAsArrayBuffer(file);
    };

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const sendEmails = async () => {
        if (!fileContent.trim()) {
            alert("Please enter a message or upload a valid document.");
            return;
        }

        if (data.length === 0) {
            alert("No valid email addresses found.");
            return;
        }

        setSending(true);
        try {
            const response = await axios.post("https://email-app-9dmm.onrender.com/sendemail", {
                msg: fileContent,
                email: data,
            });
            if (response.data) {
                alert("Emails sent successfully!");
                setFileContent("");
                setEmailCount(0);
                setData([]);
            } else {
                alert("Failed to send emails.");
            }
        } catch (error) {
            alert("Error sending emails. Please try again later.");
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="bg-black text-white min-h-screen flex flex-col items-center py-5">
            <h1 className="text-3xl font-bold">Bulk Email Send Application</h1>
            <h2 className="text-2xl font-medium bg-blue-700 w-full text-center py-3">Send multiple emails with ease</h2>
            
            <div className="bg-blue-200 p-5 w-3/4 flex flex-col items-center gap-4 rounded-lg shadow-md">
                <h2 className="text-xl font-medium">Upload Word File or Type Your Message</h2>
                <input ref={fileInputRef} onChange={handleWordFile} type="file" accept=".docx" className="p-2 border border-black" />
                <textarea value={fileContent} onChange={(e) => setFileContent(e.target.value)} className="w-full h-40 p-3 border border-gray-500 rounded" />
                
                <h2 className="text-xl font-medium">Upload Excel File with Emails</h2>
                <input ref={fileInputRef} onChange={handleFile} type="file" accept=".xlsx, .xls" className="p-2 border border-black" />
                {fileError && <p className="text-red-500">{fileError}</p>}
                <p>Total Emails: {emailCount}</p>
                <pre className="text-xs bg-gray-100 text-black p-3 w-full overflow-auto">{JSON.stringify(excelData, null, 2)}</pre>
                
                <button onClick={sendEmails} className="px-10 py-3 bg-black text-white rounded-lg shadow-lg" disabled={sending}>
                    {sending ? "Sending..." : "Send Emails"}
                </button>
                <button onClick={handleLogout} className="px-10 py-3 bg-red-500 text-white rounded-lg shadow-lg">Logout</button>
            </div>

            <footer className="mt-10 text-xs">© 2024 Bulk Email Sender</footer>
        </div>
    );
};

export default Mailbox;
