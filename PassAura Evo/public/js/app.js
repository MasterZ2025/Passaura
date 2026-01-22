import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const btnBiometric = document.getElementById('btnBiometric');
const qrContainer = document.getElementById('qrContainer');
const actionArea = document.getElementById('actionArea');
const userEmailLabel = document.getElementById('userEmail');
const btnLogout = document.getElementById('btnLogout');
const timerSpan = document.getElementById('timer');

let currentUser = null;
let countdownInterval;

// 1. VERIFICAR SESIÓN
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userEmailLabel.textContent = user.email;
    } else {
        // Si no hay usuario, devolver al login
        window.location.href = "index.html";
    }
});

// 2. FUNCIÓN DE BIOMETRÍA (WebAuthn)
btnBiometric.addEventListener('click', async () => {
    try {
        // En un entorno real, el servidor envía un "challenge" aleatorio.
        // Aquí simulamos el challenge para que el navegador active el sensor.
        const publicKeyCredentialCreationOptions = {
            challenge: Uint8Array.from("randomStringFromServer", c => c.charCodeAt(0)),
            rp: { name: "PassAura Evo", id: window.location.hostname },
            user: {
                id: Uint8Array.from(currentUser.uid, c => c.charCodeAt(0)),
                name: currentUser.email,
                displayName: currentUser.email,
            },
            pubKeyCredParams: [{alg: -7, type: "public-key"}],
            authenticatorSelection: { userVerification: "required" }, // Obliga a usar PIN/Huella
            timeout: 60000,
            attestation: "direct"
        };

        // LLAMADA AL SENSOR
        // Nota: create() se usa para registrar una huella nueva.
        // get() se usa para verificar una existente.
        // Para este demo rápido, usamos create() porque funciona mejor sin configuración previa de servidor.
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        if (credential) {
            console.log("Biometría exitosa");
            generarQRSeguro();
        }

    } catch (error) {
        console.error("Error biométrico:", error);
        alert("Error: No se pudo verificar la identidad o el dispositivo no tiene sensor compatible.");
    }
});

// 3. GENERAR EL QR
function generarQRSeguro() {
    // Ocultar botón, mostrar QR
    actionArea.style.display = 'none';
    qrContainer.style.display = 'block';

    // Limpiar QR anterior si existe
    document.getElementById("qrcode").innerHTML = "";

    // Crear el Payload (Datos que van dentro del QR)
    const accessData = {
        uid: currentUser.uid,
        email: currentUser.email,
        timestamp: Date.now(), // Hora exacta de generación
        type: "ACCESS_token"
    };

    // Convertir a texto JSON
    const qrContent = JSON.stringify(accessData);

    // Pintar el QR
    new QRCode(document.getElementById("qrcode"), {
        text: qrContent,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    iniciarConteoRegresivo();
}

// 4. TEMPORIZADOR (UX)
function iniciarConteoRegresivo() {
    let timeLeft = 30;
    timerSpan.textContent = timeLeft;

    if(countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            alert("El código ha expirado. Genera uno nuevo.");
            window.location.reload(); // Recargar para pedir huella de nuevo
        }
    }, 1000);
}

// 5. CERRAR SESIÓN
btnLogout.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});