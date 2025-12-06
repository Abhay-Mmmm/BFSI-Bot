# RAG (Retrieval Augmented Generation) module for PRIMUM AI Sales Orchestration Platform

import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import uuid


class KnowledgeBase:
    """RAG Knowledge Base with vector storage"""
    
    def __init__(self, persist_dir="./chroma_data"):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(name="loan_knowledge")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize with sample knowledge
        self.initialize_knowledge_base()
    
    def initialize_knowledge_base(self):
        """Initialize the knowledge base with sample BFSI content"""
        sample_documents = [
            {
                "id": "product_1",
                "content": "Personal Loan: Unsecured loan up to 40 times of monthly salary. Interest rates from 10.5% to 18% depending on credit score.",
                "metadata": {"category": "product_info", "type": "personal_loan"}
            },
            {
                "id": "eligibility_1",
                "content": "Eligibility criteria: Minimum age 21, maximum 60. Minimum salary of ₹25,000 for salaried. Business income should be ₹3,00,000 annually.",
                "metadata": {"category": "eligibility", "type": "requirements"}
            },
            {
                "id": "emi_1",
                "content": "EMI calculation: EMI = [P x R x (1+R)^N]/[(1+R)^N-1], where P=Loan amount, R=monthly interest rate, N=loan tenure in months.",
                "metadata": {"category": "emi_calculation", "type": "faq"}
            },
            {
                "id": "interest_1",
                "content": "Interest rates: 10.5% for credit score 750+, 11.5% for 700-749, 13.5% for below 700. Rates may vary based on relationship and other factors.",
                "metadata": {"category": "interest_rates", "type": "product_info"}
            },
            {
                "id": "documentation_1",
                "content": "Required documents: Identity proof, address proof, income proof (3 months salary slip/bank statement), employment verification, bank statements.",
                "metadata": {"category": "documentation", "type": "requirements"}
            },
            {
                "id": "compliance_1",
                "content": "All loans comply with RBI guidelines. Processing fee up to 2% of loan amount. Maximum interest rate ceiling as per RBI regulations.",
                "metadata": {"category": "compliance", "type": "regulatory"}
            },
            {
                "id": "prepayment_1",
                "content": "Prepayment allowed after 6 months. No charges for part payment of up to 25% of outstanding amount per year.",
                "metadata": {"category": "prepayment", "type": "policy"}
            }
        ]
        
        # Add documents to the collection
        documents = [doc["content"] for doc in sample_documents]
        ids = [doc["id"] for doc in sample_documents]
        metadatas = [doc["metadata"] for doc in sample_documents]
        
        self.collection.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas
        )
    
    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search the knowledge base for relevant documents"""
        query_embedding = self.embedder.encode([query]).tolist()
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k
        )
        
        formatted_results = []
        for i in range(len(results['documents'][0])):
            formatted_results.append({
                "content": results['documents'][0][i],
                "metadata": results['metadatas'][0][i],
                "distance": results['distances'][0][i] if results['distances'] else 0
            })
        
        return formatted_results


# Example usage
if __name__ == "__main__":
    kb = KnowledgeBase()
    results = kb.search("What are the eligibility criteria for personal loans?")
    for result in results:
        print(f"Content: {result['content']}")
        print(f"Metadata: {result['metadata']}")
        print(f"Distance: {result['distance']}\n")