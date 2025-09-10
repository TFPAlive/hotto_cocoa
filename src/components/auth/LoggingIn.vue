<template>
    <div class="logging-in-container">
        <div class="spinner"></div>
        <p>Logging in, please wait...</p>
    </div>
</template>

<style scoped>
.logging-in-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    font-family: Arial, sans-serif;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 6px solid #eee;
    border-top: 6px solid #3e8ed0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

p {
    font-size: 1.2rem;
    color: #444;
}
</style>