const calcularDistancia = (punto1, punto2) => {
    return Math.sqrt(
      Math.pow(punto1.latitude - punto2.latitude, 2) +
      Math.pow(punto1.longitude - punto2.longitude, 2)
    );
  };

  export default calcularDistancia;