# Reparación de pantalla blanca — YouTube Practice

Esta reparación sustituye **dos archivos existentes** y no borra canciones, entidades ni datos.

1. En GitHub abre la carpeta `src/lib` y reemplaza `youtubePractice.js` por el archivo de este paquete.
2. Abre la carpeta `src/components` y reemplaza `YouTubePracticePlayer.jsx` por el archivo de este paquete.
3. Haz un único commit con ambos cambios y espera a que Base44 sincronice.
4. Refresca la vista previa.

Los dos archivos se entregan juntos porque el componente anterior intentaba importar funciones que no estaban presentes en la versión de `youtubePractice.js` que quedó publicada. Esa incompatibilidad detiene Vite y deja la aplicación completamente en blanco.
