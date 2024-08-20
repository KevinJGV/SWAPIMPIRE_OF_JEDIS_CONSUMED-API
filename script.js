"use strict";

// Nota: Los comentarios en este código fueron generados por una IA.

// Selección de elementos del DOM
const GRID_UI = document.querySelector(".grid");
const ANTERIOR_BOTON = document.querySelector("#anterior");
const SIGUIENTE_BOTON = document.querySelector("#siguiente");
const elementos_recorridos = document.querySelector(".current_pag");
const elementos_totales = document.querySelector(".total_pags");
const ELEMENTO_INFO = document.querySelector("#info");
const TITULO_INFO = ELEMENTO_INFO.querySelector("#info_card #info_card_head h3");
const CUERPO_INFO = ELEMENTO_INFO.querySelector("#info_card #info_card_body");

// Variable global para la página actual
let current_page = 1;

// Función para capitalizar la primera letra de una cadena
const capitalizar = (cadena) => cadena[0].toUpperCase() + cadena.slice(1);

// Función para reemplazar guiones bajos con espacios y capitalizar
const Deshacer_Underscore = (string) => capitalizar(string.split("_").join(" "));

// Función para extraer números de una cadena
const encontrarNumeros = (cadena) => cadena.match(/[0-9]/g)?.join("") || "";

// Función para reemplazar espacios con guiones bajos
const cadenaConGuionesBajos = (cadena) => cadena.split(" ").join("_");

// Función para obtener datos de la API
async function obtenerDatosAPI(url) {
    const opciones = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    };

    try {
        const respuesta = await fetch(new Request(url, opciones));
        if (!respuesta.ok) throw new Error(`¡Error HTTP! estado: ${respuesta.status}`);
        return await respuesta.json();
    } catch (error) {
        console.error("Error al obtener datos:", error);
        throw error;
    }
}

// Función para cargar JSON de la página actual
async function cargarJsonPaginaActual(pagina) {
    const paginaActual = document.location.pathname.split("/").pop().split(".")[0];
    if (paginaActual !== "index" && paginaActual !== "") {
        const url = `https://swapi.py4e.com/api/${paginaActual}/${pagina ? `?page=${pagina}` : ''}`;
        return await obtenerDatosAPI(url);
    }
}

// Cache para almacenar datos de la API
const cacheAPI = new Map();

// Función para cargar y cachear datos de un item específico
async function cargarJsonItem(url) {
    if (cacheAPI.has(url)) return cacheAPI.get(url);
    const datos = await obtenerDatosAPI(url);
    cacheAPI.set(url, datos);
    return datos;
}

// Función para cargar y mostrar una página
async function cargarPagina(pagina) {
    const json = await cargarJsonPaginaActual(pagina);
    actualizarInfoPaginacion(json);
    crearElementosLista(json.results);
    return json;
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(json) {
    if (json.next || json.previous) {
        elementos_recorridos.textContent = (json.next ? Number(json.next.split("page=")[1]) - 1 : Math.ceil(json.count / 10)) * 10;
        elementos_totales.textContent = json.count;
    } else {
        elementos_recorridos.parentElement.parentElement.remove();
    }
}

// Función para crear elementos de lista
function crearElementosLista(resultados) {
    const ulPrincipal = document.querySelector("main ul");
    ulPrincipal.innerHTML = ''; // Limpiar la lista existente
    resultados.forEach((item) => {
        const item_element = document.createElement("li");
        item_element.classList.add("card", "selectDisable", "flex", "grid_text_center");
        item_element.dataset.id = encontrarNumeros(item.url.slice(-4));
        item_element.textContent = item.title || item.name;
        ulPrincipal.appendChild(item_element);
    });
    agregarEventListenersItems();
}

// Función para agregar event listeners a los items
function agregarEventListenersItems() {
    const items = document.querySelectorAll("main ul li");
    items.forEach((item) => {
        item.addEventListener("click", () => {
            actualizarURL("id", item.dataset.id);
            observarURL(ELEMENTO_INFO, items);
        });
    });
}

// Función para actualizar la URL
function actualizarURL(param, valor) {
    const parametrosURL = new URLSearchParams(window.location.search);
    if (valor) {
        parametrosURL.set(param, valor);
        history.pushState({}, "", `${window.location.pathname}?${parametrosURL.toString()}`);
    } else {
        history.pushState({}, "", window.location.pathname);
    }
}

// Función para observar cambios en la URL
async function observarURL(elementoInfo, items) {
    const parametrosURL = new URLSearchParams(window.location.search);
    const id = parametrosURL.get("id");
    if (id) {
        await cargarInfo(id);
        elementoInfo.classList.remove("no_display");
        elementoInfo.style.opacity = 1;
    }
}

// Función para obtener información específica de un item
function ObtenerITEM_URL(item, string, bool_or_Number) {
    return bool_or_Number === "bool" ? item.url.includes(string) : item.url.split("/")[bool_or_Number];
}

// Función para obtener un parámetro de la URL
function obtenerParametroURL(key) {
    return new URLSearchParams(window.location.search).get(key);
}

// Función para cargar información de un item
async function cargarInfo(id) {
    const jsonObtenido = await cargarJsonPaginaActual(current_page);
    const posicion = jsonObtenido.results.find((pos) => id === encontrarNumeros(pos.url.slice(-4)));
    if (posicion) await estructurarItems(posicion);
}

// Función para crear una lista de información
async function crearUlInfoForOf(clave, objetoItem) {
    if (objetoItem[clave].length > 0) {
        const tituloUl = document.createElement("strong");
        tituloUl.textContent = Deshacer_Underscore(clave);
        const elementoUl = document.createElement("ul");
        elementoUl.classList.add("flex", "wrap", "j_c");

        const itemsLista = await Promise.all(objetoItem[clave].map(async (valor) => {
            const jsonClave = await cargarJsonItem(valor);
            const pathname = new URL(jsonClave.url);
            const id = pathname.pathname.split("/")[3];
            const pagina = Math.ceil(id / 10);
            const elementoLi = document.createElement("li");
            elementoLi.classList.add("card");
            const elementoA = document.createElement("a");
            elementoA.href = `${pathname.pathname.split("/")[2]}.html?page=${pagina}&id=${id}`;
            elementoA.textContent = jsonClave.title || jsonClave.name;
            elementoLi.appendChild(elementoA);
            return elementoLi;
        }));

        itemsLista.forEach((li) => elementoUl.appendChild(li));
        return [tituloUl, elementoUl];
    }
}

// Función para crear párrafos con información
async function crearParStrongTexto(titulo, contenido) {
    if (contenido.length > 0 && !["title", "name", "created", "edited", "url"].includes(titulo)) {
        const strong = document.createElement("strong");
        strong.textContent = Deshacer_Underscore(titulo);
        if (!URL.canParse(contenido)) {
            const p = document.createElement("p");
            p.textContent = contenido;
            return [strong, p];
        } else {
            const jsonClave = await cargarJsonItem(contenido);
            const pathname = new URL(jsonClave.url);
            const id = Number(pathname.pathname.split("/")[3]);
            const pagina = Math.ceil(id / 10);
            const a = document.createElement("a");
            a.classList.add("card");
            a.href = `${pathname.pathname.split("/")[2]}.html?page=${pagina}&id=${id}`;
            a.textContent = jsonClave.title || jsonClave.name;
            return [strong, a];
        }
    }
}

// Función para estructurar y mostrar información de un item
async function estructurarItems(item) {
    TITULO_INFO.textContent = item.title || item.name;
    CUERPO_INFO.innerHTML = ''; // Limpiar el contenido existente

    const elementos = await Promise.all(Object.entries(item).map(async ([key, value]) => {
        if (Array.isArray(value)) {
            return await crearUlInfoForOf(key, item);
        } else {
            return await crearParStrongTexto(key, value);
        }
    }));

    elementos.filter(Boolean).flat().forEach((elem) => CUERPO_INFO.appendChild(elem));
}

// Función para evaluar la navegación
function evaluacionNavegacion(e, valor_maximo) {
    const elementosActuales = Number(elementos_recorridos.textContent);
    return e.target.id === "siguiente" 
        ? elementosActuales + 10 <= Number(valor_maximo)
        : elementosActuales - 10 >= 1;
}

// Función para ocultar/mostrar botones de navegación
function ocultarBoton(valor_maximo) {
    const elementosActuales = Number(elementos_recorridos.textContent);
    SIGUIENTE_BOTON.classList.toggle("hidden", elementosActuales + 10 > Number(valor_maximo));
    ANTERIOR_BOTON.classList.toggle("hidden", elementosActuales - 10 < 1);
}

// Event listener principal cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", async () => {
    current_page = obtenerParametroURL("page") || 1;
    let jsonObtenido;
    try {
        jsonObtenido = await cargarPagina(current_page);
    } catch (error) {
        console.error("Error al cargar la página:", error);
        return;
    }

    document.querySelector(".exit").addEventListener("click", () => {
        actualizarURL();
        ELEMENTO_INFO.style.opacity = 0;
        ELEMENTO_INFO.classList.add("no_display");
        TITULO_INFO.textContent = "";
        CUERPO_INFO.innerHTML = '';
    });

    actualizarURL("page", current_page);
    observarURL(ELEMENTO_INFO, document.querySelectorAll("main ul li"));
    ocultarBoton(jsonObtenido.count);

    window.addEventListener("popstate", async () => {
        current_page = obtenerParametroURL("page") || current_page;
        jsonObtenido = await cargarPagina(current_page);
        actualizarURL("page", current_page);
        observarURL(ELEMENTO_INFO, document.querySelectorAll("main ul li"));
        ocultarBoton(jsonObtenido.count);
    });

    [SIGUIENTE_BOTON, ANTERIOR_BOTON].forEach((button) => {
        button.addEventListener("click", async (e) => {
            if (evaluacionNavegacion(e, jsonObtenido.count)) {
                current_page = e.target.id === "siguiente" ? ++current_page : --current_page;
                jsonObtenido = await cargarPagina(current_page);
                actualizarURL("page", current_page);
                observarURL(ELEMENTO_INFO, document.querySelectorAll("main ul li"));
                ocultarBoton(jsonObtenido.count);
            }
        });
    });
});