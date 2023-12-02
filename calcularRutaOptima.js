import calcularDistancia from "./calcularDistancia";


const calcularRutaOptima = (ubicacionInicial, destinos) => {
    const destinosNoVisitados = [...destinos];
    const rutaOptima = [];
  
    // Agregar el punto inicial al inicio de la ruta
    rutaOptima.push(ubicacionInicial);
  
    while (destinosNoVisitados.length > 0) {
      let clienteMasCercano = destinosNoVisitados[0];
      let distanciaMinima = calcularDistancia(rutaOptima[rutaOptima.length - 1], clienteMasCercano);
  
      for (let i = 1; i < destinosNoVisitados.length; i++) {
        const distancia = calcularDistancia(rutaOptima[rutaOptima.length - 1], destinosNoVisitados[i]);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          clienteMasCercano = destinosNoVisitados[i];
        }
      }
  
      rutaOptima.push(clienteMasCercano);
      destinosNoVisitados.splice(destinosNoVisitados.indexOf(clienteMasCercano), 1);
    }
  
    return rutaOptima;
   
  };
  
  export default calcularRutaOptima;