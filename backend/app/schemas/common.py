from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class Message(BaseModel):
    message: str

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
