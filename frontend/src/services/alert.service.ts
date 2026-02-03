import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0f0f0f',
    color: '#fff',
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

export const alertSuccess = (title: string, text?: string) => {
    Toast.fire({
        icon: 'success',
        title: title,
        text: text
    });
};

export const alertError = (title: string, text?: string) => {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        background: '#0f0f0f',
        color: '#fff',
        confirmButtonColor: '#f43f5e'
    });
};

export const alertConfirm = async (title: string, text: string) => {
    return await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#f43f5e',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        background: '#0f0f0f',
        color: '#fff'
    });
};
