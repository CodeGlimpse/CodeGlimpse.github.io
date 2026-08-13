(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.CodeGlimpseBmi = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function calculate(heightCm, weightKg) {
        const height = Number(heightCm);
        const weight = Number(weightKg);
        if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
            throw new RangeError('Height and weight must be positive numbers');
        }

        const bmi = weight / ((height / 100) ** 2);
        if (!Number.isFinite(bmi)) throw new RangeError('BMI is outside the supported range');
        return bmi;
    }

    return { calculate };
});
