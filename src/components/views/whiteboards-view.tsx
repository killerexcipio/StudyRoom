
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSignature } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { Whiteboard } from "@/lib/data";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import * as WhiteboardService from "@/services/whiteboard-service";

export default function WhiteboardsView() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchAndSetWhiteboards = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await WhiteboardService.fetchWhiteboards();
                setWhiteboards(data);
            } catch (error) {
                 toast({
                    title: "Error fetching whiteboards",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetWhiteboards();
    }, [user, toast]);

  return (
    <div className="flex-1 p-4 md:p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Whiteboards</h1>
      </header>
      {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {whiteboards.map(wb => (
                <Link href={`/whiteboard/${wb.id}`} key={wb.id}>
                    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{wb.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                            <FileSignature className="w-16 h-16 text-gray-300" />
                        </CardContent>
                        <CardFooter className="flex items-center justify-between text-xs text-gray-500 pt-4">
                            <span>
                                Created {formatDistanceToNow(new Date(wb.created_at), { addSuffix: true })}
                            </span>
                        </CardFooter>
                    </Card>
                </Link>
            ))}
        </div>
      )}
    </div>
  );
}
