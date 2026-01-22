import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const btnLogout = document.getElementById('btnLogout');
const scanInterface = document.getElementById('scan-interface');
const successCard = document.getElementById('successCard');
const errorCard = document.getElementById('errorCard');
const sound = document.getElementById('scanSound');

// VARIABLE GLOBAL PARA CONTROLAR EL ESCÁNER
let html5QrcodeScanner = null;

// 1. VERIFICAR LOGIN
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "index.html";
    } else {
        // Arrancamos el escáner al entrar
        iniciarEscaner();
    }
});

// 2. INICIAR LA CÁMARA
function iniciarEscaner() {
    // Aseguramos que se vean las tarjetas correctas
    scanInterface.style.display = 'block';
    successCard.style.display = 'none';
    errorCard.style.display = 'none';

    // EVITAR DOBLE INICIALIZACIÓN
    // Si ya existe un escáner limpiarlo antes de crear uno nuevo
    if (html5QrcodeScanner) { 
        // Solo limpiamos si hubo un error previo de renderizado, 
        // pero normalmente llegaremos aquí con el escáner ya destruido por clear().
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: 250 }
    );
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// 3. CUANDO DETECTA UN QR
async function onScanSuccess(decodedText, decodedResult) {
    try {
        // PASO CRÍTICO: APAGAR EL ESCÁNER INMEDIATAMENTE
        // Esto detiene la cámara y evita que lea el mismo código 2 veces
        if (html5QrcodeScanner) {
            await html5QrcodeScanner.clear(); 
            // .clear() elimina la cámara del DOM, así es imposible que siga leyendo
        }

        sound.play(); // Beep! un solo beep

        // A. Parsear JSON
        const data = JSON.parse(decodedText);
        
        // B. VALIDACIÓN DE TIEMPO (30s)
        const ahora = Date.now();
        const diferencia = (ahora - data.timestamp) / 1000;

        if (diferencia > 30) {
            throw new Error(`Código expirado hace ${Math.floor(diferencia)}s.`);
        }

        // C. REGISTRAR EN FIREBASE
        await registrarAsistencia(data);

        // D. MOSTRAR ÉXITO
        mostrarExito(data);

    } catch (error) {
        console.error(error);
        mostrarError(error.message);
    }
}

function onScanFailure(error) {
    // Silencio...
}

// 4. GUARDAR EN BD
async function registrarAsistencia(datosUsuario) {
    try {
        await addDoc(collection(db, "asistencia"), {
            uid: datosUsuario.uid,
            email: datosUsuario.email,
            fecha: new Date(),
            tipo: "ENTRADA",
            validadoPor: auth.currentUser.email
        });
    } catch (e) {
        console.error("Error BD: ", e);
    }
}

// 5. FUNCIONES VISUALES
function mostrarExito(data) {
    scanInterface.style.display = 'none'; // Ocultar contenedor vacío
    successCard.style.display = 'block';
    
    document.getElementById('employeeName').textContent = data.email.split('@')[0];
    document.getElementById('entryTime').textContent = new Date().toLocaleTimeString();
    
    // Configurar botón "Siguiente"
    const btnNext = successCard.querySelector('button');
    btnNext.onclick = reiniciarProceso; // Usamos función propia, no reload()
}

function mostrarError(mensaje) {
    scanInterface.style.display = 'none';
    errorCard.style.display = 'block';
    
    document.getElementById('errorMsg').textContent = mensaje;
    
    // Configurar botón "Reintentar"
    const btnRetry = errorCard.querySelector('button');
    btnRetry.onclick = reiniciarProceso; // Usamos función propia
}

// NUEVA FUNCIÓN: Reiniciar sin recargar toda la página
function reiniciarProceso() {
    iniciarEscaner();
}

// 6. LOGOUT
btnLogout.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});