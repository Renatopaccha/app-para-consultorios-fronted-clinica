import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/Register.tsx');
let content = fs.readFileSync(file, 'utf8');

const newOnSubmit = `
  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      // 1. Ejecutamos el registro en el backend a través del AuthContext
      // Esto crea el usuario, recibe JWT + User y lo guarda en el estado local evitando el crash
      await authRegister({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        licenseNumber: data.licenseNumber,
        consultationPrice: data.consultationPrice,
        name: data.name,
        address: data.address,
      });

      // 2. Redirigimos al dashboard dándole tiempo a React para asimilar el nuevo estado global
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 150);

    } catch (err) {
`;

content = content.replace(
  /const onSubmit = async \(data: RegisterFormData\) => \{[\s\S]*?\} catch \(err\) \{/,
  newOnSubmit.trim()
);

fs.writeFileSync(file, content);
console.log("Updated Register.tsx timeout");
