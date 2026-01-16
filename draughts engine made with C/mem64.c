/* mem64.c: low-performance 64-bit memory manager with page compression */

/*
 * Copyright 1996-2004 by Michel D. Grimminck
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */


#include <stdio.h>
#include "const.h"
#include <time.h>
#ifdef USE_ZLIB
    #include "/usr/include/zlib.h"
#endif

#define PAGESIZE (1024LL*1024LL)        /* size of a page */
#define MAXPAGES 1200LL        /* maximum number of pages in ram */
#define MAXFILESIZE 1800000000LL   /* when larges than this, files will be split into blocks */
#define MAXHANDLE 22000   /* maximal number of memory64 handles */
#define CLEANFILES "rm -f tmp/mem64*"

INT64 mem64_allocatedAmount[MAXHANDLE];   /* allocated amount in bytes for handle */
int mem64_numberOfPages[MAXHANDLE];       /* number of pages for handle */
void *mem64_pointerList[MAXHANDLE];       /* pointer to list with memory pointers */
int *mem64_pageNumber[MAXHANDLE];         /* pointer to list with pagenumber */

char *mem64[MAXPAGES];          /* pointer to PAGESIZE amount of memory */
INT64 mem64_increment[MAXPAGES];  /* last time this page was accessed */
int mem64_handle[MAXPAGES];     /* the handle associatied with this page */
int mem64_hpage[MAXPAGES];      /* the pagenumber within handle=index/pagesize */
int mem64_dirty[MAXPAGES];      /* page is dirty */
char pagefile[255];

INT64 mem64_diskActivity=0LL;
INT64 increment=0LL;


void mem64_init(int showinfo)
{
    int i;
    char inf[100];
    
    system(CLEANFILES);
    //printf("Pagefile: %s\n",pagefile);
    if (showinfo==true) {
        dprint("Memory handler pagesize: %s bytes, ",neatNumber(PAGESIZE));
        dprint("RAM-allocation: %s bytes.\n",neatNumber(PAGESIZE*MAXPAGES));
    }
    for (i=0;i<MAXHANDLE;i++) {
        mem64_allocatedAmount[i]=NULL;
        mem64_numberOfPages[i]=NULL;
        mem64_pointerList[i]=NULL;
    }
    mem64_diskActivity=0LL;
    for (i=0;i<MAXPAGES;i++) {
        mem64[i]=NULL;
        mem64_handle[i]=-1;
        mem64_hpage[i]=-1;
        mem64_increment[i]=0LL;
    }
    increment=0LL;
}

INT64 mem64_RAM(void)
/* returns the number of bytes allocated by mem64 */
{
    return(PAGESIZE*MAXPAGES);
}

void mem64_exit()
{
    char pg[100];
    int handle,hpage;
    
    for(handle=0;handle<MAXHANDLE;handle++) {
        if (mem64_allocatedAmount[handle]!=0LL) {
            for (hpage=0;hpage<mem64_numberOfPages[handle];hpage++) {
                sprintf(pg,pagefile,handle,hpage);
                unlink(pg);
            }
        }
    }
}

int mem64_allocate(INT64 amount)
/* returns a mem64 handle. if handle<0 the memory allocation failed */
{
    INT64 pages;
    int handle;
    int fp;
    int i;
    void **base;
    int *numbers;    
    /* get a new handle */
    handle=-1;
    for(i=0;i<MAXHANDLE;i++) {
        if (mem64_allocatedAmount[i]==0LL) {
            handle=i;
            break;
        }
    }
    if (handle<0) return(handle);
    
    pages=(amount+PAGESIZE-1)/PAGESIZE;
    /*printf("pages: %i, handle:%i\n",pages,handle);*/
    
    mem64_allocatedAmount[handle]=amount;
    
    base=(void *)malloc(pages*sizeof(char *));
    if (base==NULL) {
        printf("Fatal: malloc failure on _base_\n");
        exit(1);
    }
    numbers=(int *)malloc(pages*sizeof(int *));
    if (numbers==NULL) {
        printf("Fatal: malloc failure on _numbers_\n");
        exit(1);
    }
    /*printf("pointerlist=%i  %i\n",pages*sizeof(char *),base);
    printf("pointerlist=%i  %i\n",pages*sizeof(int *),numbers);*/
    mem64_pointerList[handle]=base;
    mem64_pageNumber[handle]=numbers;
    mem64_numberOfPages[handle]=pages;
    for(i=0;i<pages;i++) {
        fp=mem64_getFreePage();
        if (mem64[fp]==NULL) { /* mem64 has not yet been allocated */
            mem64[fp]=(char *) malloc(PAGESIZE);
            if (mem64[fp]==0) {
                printf("Fatal: malloc failure on _mem64[%i]_\n",fp);
                exit(1);
            }
        }
        
        /*printf("a%i %i %i %i\n",i,fp,mem64[fp],base[i]);*/
        base[i]=mem64[fp];
        mem64_handle[fp]=handle;
        mem64_hpage[fp]=i;
        mem64_increment[fp]=(increment++);
        mem64_dirty[fp]=true;
        numbers[i]=fp;
    }
    /*printf("sadfdf\n");*/
        
    return (handle);
}

int mem64_getFreePage()
{
    int i;
    int fp;
    INT64 oldestPage=9000000000000000000LL;
    int oldest=-1;
    
    fp=-1;
    oldest=-1;
    for (i=0;i<MAXPAGES;i++) {
        if (mem64[i]==NULL) {
            fp=i;
            break;
        }
        if (mem64_increment[i]<oldestPage) {
            oldestPage=mem64_increment[i];
            oldest=i;
        }
    }
    if (fp>=0) return (fp);
    /* no page found, write the oldest to disk or discard it if is it not changed */
    writePage(oldest);
    return(oldest);
}

writePage(int page)
{
    char pg[100];
    int handle,hpage;
    FILE *out;
    void **base;
    int j;
    gzFile gzOut;
    int br;
    
    handle=mem64_handle[page];
    hpage=mem64_hpage[page];
    
    /* save page to disk */
    /*printf("saving page %i, handle %i/%i\n",page,handle,hpage,mem64[page]);*/
    if (mem64_dirty[page]==true) { //save
        sprintf(pg,pagefile,handle,hpage);
        /*printf("%s\n",pagefile);*/
        #ifdef USE_ZLIB 
            gzOut = gzopen(pg, "wb1");
            if (gzOut==NULL) {
                printf("fatal: gzwrite error on %s\n",pg);
                exit(1);
            }
            br=gzwrite(gzOut, mem64[page], PAGESIZE);
            if (br==0) { 
                printf("fatal: gzwrite (2) error on %s\n",pg);
                exit(1);
            }
            gzclose(gzOut);
            mem64_diskActivity+=br;
        #else
            out=fopen(pg,"wb");
                if (out==NULL) {
                     printf("fatal: write error on %s\n",pg);
                     exit(1);
               }
            fwrite(mem64[page],1,PAGESIZE,out);
            fclose(out);
            mem64_diskActivity+=PAGESIZE;
        #endif
    }
        /*for (j=0;j<PAGESIZE;j++) printf("%i",mem64[page][j]);*/
    /*printf("\n");*/
    /* mark page as unused */
    base=mem64_pointerList[handle];
    base[hpage]=0;
    mem64_pageNumber[handle][hpage]=-1;
    mem64_handle[page]=-1;
    mem64_hpage[page]=-1;
    mem64_dirty[page]=false;
}

loadPage(int page,int handle,int hpage)
{
    char pg[100];
    FILE *in;
    void **base;
    gzFile zin;
    int amountread;
    
    /* save page to disk */
    /*printf("loading page %i, handle %i/%i\n",page,handle,hpage);*/
    sprintf(pg,pagefile,handle,hpage);
    /*printf("%s %i\n",pagefile,mem64[page]);*/
    
    #ifdef USE_ZLIB 
    zin = gzopen(pg, "rb");
	if (zin == NULL) {
        printf("fatal: read error on %s\n",pg);
        exit(1);
    }
    amountread = gzread(zin, mem64[page], sizeof(unsigned char)*PAGESIZE);
    if (gzclose(zin) != Z_OK) printf("\n\nfailed gzclose\n\n");
    mem64_diskActivity+=amountread;
    #else
    in=fopen(pg,"rb");
    if (in==NULL) {
        printf("fatal: read error on %s\n",pg);
        exit(1);
    }
    fread(mem64[page],1,PAGESIZE,in);
    fclose(in);
    mem64_diskActivity+=PAGESIZE;
    #endif
    
    /* mark page as in use */
    base=mem64_pointerList[handle];
    base[hpage]=mem64[page];
    mem64_pageNumber[handle][hpage]=page;
    mem64_handle[page]=handle;
    mem64_hpage[page]=hpage;
    mem64_increment[page]=(increment++);
    mem64_dirty[page]=false;
}

void decompressGZfile(char *fIn,char *fOut)
{
    #define BUFFERSIZE 32768
    gzFile zIn;
    FILE *out;
    char buffer[BUFFERSIZE];
    int amountread;
    int j;
    
    zIn = gzopen(fIn, "rb");
	if (zIn == NULL) {
        printf("fatal: read error on %s\n",fIn);
        exit(1);
    }
    out=fopen(fOut,"wb");
    if (out==NULL) {
        printf("fatal: read error on %s\n",fOut);
        exit(1);
    }
    
    for (j=0;true;j++) {
        amountread = gzread(zIn, buffer, sizeof(unsigned char)*BUFFERSIZE);
        if (amountread==0) break;
        fwrite(buffer,1,amountread,out);
    }
    fclose(out);
    gzclose(zIn);
}

char *mem64_pointer(int handle,INT64 index,int markAsDirty)
{
    INT64 hpage;
    char *address;
    int **base;
    void *memBlock;
    char pg[100];
    int fp;
    int page;
    
    if (handle>MAXHANDLE || handle<0) {
        printf("Illegal mem64 handle: %i\n",handle);
        display_board();
        exit(0);
    }
    hpage=index/PAGESIZE;
    if (index<0 || hpage<0) {
        printf("Illegal index handle: %llu %llu\n",index,hpage);
        exit(0);
    }
    base=mem64_pointerList[handle];
    memBlock=base[hpage];
    /*printf("bla %i %llu  %u  memblock:%u\n",handle,index,base,memBlock);*/
    /*address=base[page];*/
    
    if (memBlock==0) {
        fp=mem64_getFreePage();
        loadPage(fp,handle,hpage);
        memBlock=mem64[fp];
    }
    page=mem64_pageNumber[handle][hpage];
    mem64_increment[page]=(increment++);
    if (markAsDirty==true) {
        mem64_dirty[page]=true;
    }
    //mem64_dirty[page]=true;
    return (memBlock+index%PAGESIZE);
}

mem64_free(int handle)
{
    return;
    /*
    for(i=0;i<mem64_numberOfPages[handle];i++) {

    base=mem64_pointerList[handle];
    base[hpage]=0;
    mem64_pageNumber[handle][hpage]=-1;
    mem64_handle[page]=-1;
    mem64_hpage[page]=-1;
    mem64_dirty[page]=false;


    }
    return;*/
}

mem64_save(int handle,char *filename)
{
    FILE *out;
    int i;
    unsigned int bytes;
    INT64 index=0;
    char *p;
    char myFileName[100];
    int fileSection=0;
    INT64 bytesWritten;
    gzFile gzOut;
        
    for (i=0;i<mem64_numberOfPages[handle];i++) {
        if (bytesWritten>MAXFILESIZE || i==0) {
            if (i==0) {
                sprintf(myFileName,"%s",filename);
            } else {
                sprintf(myFileName,"%s-%i",filename,fileSection);
            }
            #ifdef USE_ZLIB
                if (i>0) gzclose(gzOut);
                gzOut = gzopen(myFileName, "wb7");
                if (gzOut==NULL) {
                    printf("fatal: gzwrite error on %s\n",myFileName);
                    exit(1);
                }
            #else
                if (i>0) fclose(out);
                out=fopen(myFileName,"wb");
                if (out==NULL) {
                    printf("fatal: write error on %s\n",myFileName);
                    exit(1);
                }
            #endif
            fileSection++;
            bytesWritten=0;
        }
        if (i<(mem64_numberOfPages[handle]-1)) {
            bytes=PAGESIZE;
        } else {
            bytes=mem64_allocatedAmount[handle]%PAGESIZE;
        }
        bytesWritten+=bytes;
        p=mem64_pointer(handle,index,false);
        #ifdef USE_ZLIB
            gzwrite(gzOut, p, bytes);
	    #else
            fwrite(p,1,bytes,out);
        #endif
        index+=PAGESIZE;
    }
    #ifdef USE_ZLIB
        gzclose(gzOut);
    #else
        fclose(out);
    #endif
    mem64_diskActivity+=mem64_allocatedAmount[handle];
}

int mem64_load(int handle,char *filename)
/* returns true on success */
{
    FILE *fhandle;
    INT64 index=0;
    char *p;
    int i,j;
    char fname[256];
    int amountread=0;
#ifdef USE_ZLIB
    gzFile in;
    int len;
#endif
    
    for(i=0;true;i++) {
        fhandle=0;
        #ifdef USE_ZLIB
    	    if (i==0) sprintf(fname,"%s",filename);
            if (i>0) sprintf(fname,"%s-%i",filename,i);
            in = gzopen(fname, "rb");
	        if (in == NULL) break;
        #else
    	    if (i==0) sprintf(fname,"%s",filename);
            if (i>0) sprintf(fname,"%s-%i",filename,i);
            fhandle=fopen(fname,"rb");
            if (fhandle==NULL)  break;
        #endif
        for (j=0;true;j++) {
            p=mem64_pointer(handle,index,true);
            #ifdef USE_ZLIB
                amountread = gzread(in, p, sizeof(unsigned char)*PAGESIZE);
            #else
                amountread = fread(p,sizeof(unsigned char),PAGESIZE,fhandle);
            #endif
            index+=amountread;
            mem64_diskActivity+=amountread;
            if (amountread==0) break;
        }
        #ifdef USE_ZLIB
            if (gzclose(in) != Z_OK) printf("failed gzclose");
        #else
            fclose(fhandle);
        #endif
    }
    if (index==0) {
        printf("load failure on %s\n",filename);
        return(false);
    }
    return(true);
}
    
mem64_test()
{
    int mem64id1,mem64id2;
    char *p;
    INT64 i;
    int j;
    float t;
    char a;
    
    mem64_init(true);
    mem64id1=mem64_allocate(30LL);
    /*for (j=0;j<MAXPAGES;j++) { printf("%i ",mem64_hpage[j]); }*/
    printf("testing\n\n");
    /*mem64id2=mem64_allocate(100LL);*/
    for(i=0;i<30;i++) {
        p=mem64_pointer(mem64id1,i,true);
        *p=(char) i;
    }
    mem64id2=mem64_allocate(30LL);
    for(i=0;i<30;i++) {
        p=mem64_pointer(mem64id2,i,true);
        *p=(char) (100+i);
    }

    for(i=0;i<30;i++) {
        p=mem64_pointer(mem64id1,i,true);
        /*printf("read: %llu   %i\n",i,*p);*/
    }
    for(i=0;i<30;i++) {
        p=mem64_pointer(mem64id2,i,true);
        /*printf("read2: %llu   %i\n",i,*p);*/
    }
    for(i=0;i<30;i++) {
        p=mem64_pointer(mem64id2,i,true);
        /*printf("read2: %llu   %i\n",i,*p);*/
    }


    printf("Disk-activity: %llu\n",mem64_diskActivity);
    mem64_save(mem64id1,"h1.txt");
    mem64_save(mem64id2,"h2.txt");

    t=clock();
    printf("%f\n",t);
    mem64id1=mem64_allocate(5000000000LL);
    
    for (i=0;i<5000000000LL;i++) {
        p=mem64_pointer(mem64id1,i,true);
        *p=a;
        a++;
    }
    printf("asdfsdF\n");
    mem64_save(mem64id1,"/tmp/test.txt");
    t=clock();
    printf("%f %i\n",t,CLOCKS_PER_SEC);
    
    exit(1);
}
    
