import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agent Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure and manage AI agents and their settings.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Chat AI Agent</CardTitle>
            <CardDescription>
              Configure the chat AI assistant settings and behavior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button>Configure</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Search AI Agent</CardTitle>
            <CardDescription>
              Configure the search AI assistant for Quranic content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button>Configure</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recommendations Agent</CardTitle>
            <CardDescription>
              Configure the AI system that recommends content to users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end">
              <Button>Configure</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Usage Statistics</CardTitle>
            <CardDescription>
              View usage metrics and performance of AI agents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Statistics dashboard will appear here once AI agents are configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}