import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LighthouseConnection, LighthouseEvent, LighthouseCommand } from '@/lib/lighthouse-demo';
import { Zap, Wifi, WifiOff, Terminal, Send, Trash2, Activity, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LighthouseDemo = () => {
  const [connection] = useState(() => new LighthouseConnection());
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<LighthouseEvent[]>([]);
  const [customCommand, setCustomCommand] = useState('');
  const [restEndpoint, setRestEndpoint] = useState('/api/health');
  const [restMethod, setRestMethod] = useState<'GET' | 'POST'>('GET');
  const [restPayload, setRestPayload] = useState('');
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to events
    const unsubscribe = connection.onEvent((event) => {
      setEvents(connection.getEvents());
    });

    // Initialize events display
    setEvents(connection.getEvents());

    return unsubscribe;
  }, [connection]);

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleConnect = async () => {
    try {
      await connection.connect();
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "WebSocket connection established",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not establish WebSocket connection",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    connection.disconnect();
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "WebSocket connection closed",
    });
  };

  const handleSendTestCommand = (command: LighthouseCommand) => {
    connection.sendCommand(command);
  };

  const handleSendCustomCommand = () => {
    if (!customCommand.trim()) return;
    
    try {
      const command: LighthouseCommand = JSON.parse(customCommand);
      connection.sendCommand(command);
      setCustomCommand('');
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please enter a valid JSON command",
        variant: "destructive",
      });
    }
  };

  const handleTestRest = () => {
    let payload;
    if (restMethod === 'POST' && restPayload.trim()) {
      try {
        payload = JSON.parse(restPayload);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please enter valid JSON for the payload",
          variant: "destructive",
        });
        return;
      }
    }
    
    connection.testRestEndpoint(restEndpoint, restMethod, payload);
  };

  const getEventIcon = (type: LighthouseEvent['type']) => {
    switch (type) {
      case 'connection': return <Wifi className="h-3 w-3" />;
      case 'command': return <Send className="h-3 w-3" />;
      case 'response': return <Activity className="h-3 w-3" />;
      case 'error': return <WifiOff className="h-3 w-3" />;
      default: return <Terminal className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: LighthouseEvent['type']) => {
    switch (type) {
      case 'connection': return 'bg-blue-500';
      case 'command': return 'bg-green-500';
      case 'response': return 'bg-purple-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Lighthouse Demo</h1>
              <p className="text-muted-foreground">Test WebSocket and REST connections to your Cursor backend</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center space-x-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </Badge>
            <Button 
              onClick={isConnected ? handleDisconnect : handleConnect}
              variant={isConnected ? "destructive" : "default"}
            >
              {isConnected ? 'Disconnect' : 'Connect WebSocket'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="space-y-6">
            <Tabs defaultValue="websocket" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="websocket">WebSocket</TabsTrigger>
                <TabsTrigger value="rest">REST API</TabsTrigger>
              </TabsList>
              
              <TabsContent value="websocket" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Test Commands</span>
                    </CardTitle>
                    <CardDescription>Send predefined commands to test WebSocket functionality</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {connection.getTestCommands().map((test, index) => (
                      <Button
                        key={index}
                        onClick={() => handleSendTestCommand(test.command)}
                        disabled={!isConnected}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {test.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Command</CardTitle>
                    <CardDescription>Send a custom JSON command</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder='{"action": "custom_action", "payload": {"key": "value"}}'
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      className="font-mono text-sm"
                      rows={4}
                    />
                    <Button 
                      onClick={handleSendCustomCommand}
                      disabled={!isConnected || !customCommand.trim()}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Command
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rest" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>REST API Test</span>
                    </CardTitle>
                    <CardDescription>Test REST endpoints on your backend</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={restEndpoint}
                        onChange={(e) => setRestEndpoint(e.target.value)}
                        placeholder="/api/health"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="method">Method</Label>
                      <Select value={restMethod} onValueChange={(value: 'GET' | 'POST') => setRestMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {restMethod === 'POST' && (
                      <div className="space-y-2">
                        <Label htmlFor="payload">Payload (JSON)</Label>
                        <Textarea
                          id="payload"
                          value={restPayload}
                          onChange={(e) => setRestPayload(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="font-mono text-sm"
                          rows={3}
                        />
                      </div>
                    )}

                    <Button onClick={handleTestRest} className="w-full">
                      <Send className="h-4 w-4 mr-2" />
                      Test {restMethod} {restEndpoint}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Events Log */}
          <Card className="h-fit max-h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5" />
                    <span>Event Log</span>
                  </CardTitle>
                  <CardDescription>Real-time events and responses</CardDescription>
                </div>
                <Button
                  onClick={() => connection.clearEvents()}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-2 border-muted pl-3 py-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`p-1 rounded-full ${getEventColor(event.type)}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{event.message}</p>
                      {event.data && (
                        <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  <div ref={eventsEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    );
};

export default LighthouseDemo;