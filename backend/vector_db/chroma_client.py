"""
ChromaDB client for vector storage and retrieval.
Manages embeddings and semantic search for the knowledge base.
"""
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from pathlib import Path
import os


class VectorDBClient:
    """ChromaDB client for vector operations"""

    def __init__(self, persist_directory: str = None):
        if persist_directory is None:
            # Default to project's data directory
            base_dir = Path(__file__).parent.parent.parent
            persist_directory = str(base_dir / "data" / "chroma")

        # Ensure directory exists
        Path(persist_directory).mkdir(parents=True, exist_ok=True)

        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Get or create collection
        self.collection_name = "helpdesk_articles"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "1&1 help center articles"}
        )

    def add_documents(
        self,
        documents: List[str],
        metadatas: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Add documents to the vector database.

        Args:
            documents: List of document texts
            metadatas: List of metadata dictionaries (title, url, etc.)
            ids: Optional list of document IDs (auto-generated if not provided)

        Returns:
            Dictionary with operation status
        """
        if not documents:
            return {"status": "error", "message": "No documents provided"}

        # Generate IDs if not provided
        if ids is None:
            ids = [f"doc_{i}" for i in range(len(documents))]

        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

            return {
                "status": "success",
                "count": len(documents),
                "collection": self.collection_name
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for similar documents in the vector database.

        Args:
            query: Search query text
            n_results: Number of results to return
            where: Optional metadata filter

        Returns:
            Dictionary with search results
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where
            )

            return {
                "query": query,
                "n_results": len(results["ids"][0]) if results["ids"] else 0,
                "documents": results["documents"],
                "metadatas": results["metadatas"],
                "distances": results["distances"],
                "ids": results["ids"]
            }
        except Exception as e:
            return {
                "query": query,
                "error": str(e),
                "documents": [[]],
                "metadatas": [[]],
                "distances": [[]],
                "ids": [[]]
            }

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector database"""
        try:
            count = self.collection.count()
            return {
                "collection_name": self.collection_name,
                "document_count": count,
                "status": "healthy"
            }
        except Exception as e:
            return {
                "collection_name": self.collection_name,
                "error": str(e),
                "status": "error"
            }

    def delete_collection(self):
        """Delete the entire collection (use with caution!)"""
        try:
            self.client.delete_collection(self.collection_name)
            return {"status": "deleted", "collection": self.collection_name}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def reset(self):
        """Reset the collection (delete and recreate)"""
        try:
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "1&1 help center articles"}
            )
            return {"status": "reset", "collection": self.collection_name}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def update_document(
        self,
        doc_id: str,
        document: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a specific document"""
        try:
            self.collection.update(
                ids=[doc_id],
                documents=[document],
                metadatas=[metadata]
            )
            return {"status": "updated", "id": doc_id}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def delete_document(self, doc_id: str) -> Dict[str, Any]:
        """Delete a specific document"""
        try:
            self.collection.delete(ids=[doc_id])
            return {"status": "deleted", "id": doc_id}
        except Exception as e:
            return {"status": "error", "message": str(e)}
