'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Factory } from 'lucide-react';

export default function Page() {
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const { login } = useAuth();
  const router = useRouter();

  const roles: Role[] = ['Admin', 'Frame Cutting', 'Mesh Cutting', 'Quality'];

  const handleLogin = () => {
    if (selectedRole) {
      login(selectedRole as Role);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-4">
              <Factory className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Manufacturing Dashboard</CardTitle>
          <CardDescription className="text-base">
            Select your department to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Department / Role</label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose your department..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleLogin} 
            disabled={!selectedRole}
            className="w-full"
            size="lg"
          >
            Continue to Dashboard
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Demo Mode - No authentication required</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


